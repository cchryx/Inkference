import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/*
 * Web Push: sends notifications to phones (installed PWA) and browsers,
 * even when the app is closed. Needs VAPID keys in .env:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 * Without them, push is simply skipped.
 */

let configured: boolean | null = null;

function configure() {
    if (configured !== null) return configured;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
        configured = false;
        return false;
    }
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:inkference@gmail.com", publicKey, privateKey);
    configured = true;
    return true;
}

export type PushPayload = {
    title: string;
    body: string;
    url: string;
    /** Same tag = replaces the previous notification instead of stacking. */
    tag?: string;
};

export type PushReport = {
    configured: boolean;
    devices: number;
    sent: number;
    failed: number;
    /** A device was subscribed with different VAPID keys (keys changed). */
    keyMismatch: number;
};

export const isPushConfigured = () => configure();

/**
 * Sends a push to every device these people turned push on for.
 * People who switched this `type` off in Settings are skipped.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload, type?: string): Promise<PushReport> {
    const report: PushReport = { configured: configure(), devices: 0, sent: 0, failed: 0, keyMismatch: 0 };
    if (!report.configured || userIds.length === 0) {
        if (!report.configured) console.warn("push skipped: VAPID keys are missing on the server");
        return report;
    }

    try {
        let ids = [...new Set(userIds)];
        if (type) {
            const optedOut = await prisma.notificationSettings.findMany({
                where: { userId: { in: ids }, pushOff: { has: type } },
                select: { userId: true },
            });
            const off = new Set(optedOut.map((o) => o.userId));
            ids = ids.filter((id) => !off.has(id));
        }
        if (ids.length === 0) return report;

        const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: ids } } });
        report.devices = subs.length;
        const dead: string[] = [];

        await Promise.allSettled(
            subs.map(async (s) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                        JSON.stringify(payload),
                        { TTL: 60 * 60 * 24, urgency: "high" } // try for up to a day if the phone is offline
                    );
                    report.sent++;
                } catch (err) {
                    report.failed++;
                    const e = err as { statusCode?: number; body?: string };
                    const status = e.statusCode;
                    // 404/410 = the device unsubscribed or the app was removed.
                    if (status === 404 || status === 410) dead.push(s.id);
                    // 403 = this device signed up with other VAPID keys. It can
                    // never work again, so drop it (it re-registers on next visit).
                    else if (status === 403) {
                        report.keyMismatch++;
                        dead.push(s.id);
                        console.error("push rejected (VAPID key mismatch):", e.body);
                    } else console.error("push failed:", status, e.body ?? err);
                }
            })
        );

        if (dead.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
    } catch (err) {
        console.error("sendPushToUsers failed:", err);
    }
    return report;
}
