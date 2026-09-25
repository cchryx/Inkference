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

/**
 * Sends a push to every device these people turned push on for.
 * People who switched this `type` off in Settings are skipped.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload, type?: string) {
    if (!configure() || userIds.length === 0) return;

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
        if (ids.length === 0) return;

        const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: ids } } });
        const dead: string[] = [];

        await Promise.allSettled(
            subs.map(async (s) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                        JSON.stringify(payload),
                        { TTL: 60 * 60 * 24 } // try for up to a day if the phone is offline
                    );
                } catch (err) {
                    const status = (err as { statusCode?: number }).statusCode;
                    // 404/410 = the device unsubscribed or the app was removed.
                    if (status === 404 || status === 410) dead.push(s.id);
                    else console.error("push failed:", status, err);
                }
            })
        );

        if (dead.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
    } catch (err) {
        console.error("sendPushToUsers failed:", err);
    }
}
