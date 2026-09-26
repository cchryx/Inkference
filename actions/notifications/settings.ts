"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES } from "@/lib/notificationText";
import { sendPushToUsers } from "@/lib/push";
import { getSession } from "@/lib/session";

const VALID = new Set<string>(NOTIFICATION_TYPES.map((t) => t.type));

async function me() {
    const session = await getSession();
    return session?.user?.id ?? null;
}

export async function getNotificationSettings() {
    const userId = await me();
    if (!userId) return null;
    const [row, devices] = await Promise.all([
        prisma.notificationSettings.findUnique({ where: { userId } }),
        prisma.pushSubscription.count({ where: { userId } }),
    ]);
    return {
        inAppOff: row?.inAppOff ?? [],
        pushOff: row?.pushOff ?? [],
        pushDevices: devices,
        pushConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY,
    };
}

export async function updateNotificationSettings(input: { inAppOff: string[]; pushOff: string[] }) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };

    const inAppOff = input.inAppOff.filter((t) => VALID.has(t));
    const pushOff = input.pushOff.filter((t) => VALID.has(t));

    await prisma.notificationSettings.upsert({
        where: { userId },
        update: { inAppOff, pushOff },
        create: { userId, inAppOff, pushOff },
    });
    return { error: null };
}

/** Save this device so it can receive push notifications. */
export async function savePushSubscription(sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
}) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) {
        return { error: "Invalid subscription." };
    }

    await prisma.pushSubscription.upsert({
        where: { endpoint: sub.endpoint },
        update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        create: {
            userId,
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
            userAgent: sub.userAgent?.slice(0, 300),
        },
    });
    return { error: null };
}

export async function deletePushSubscription(endpoint: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
    return { error: null };
}

/** Sends a push to all of your devices and says what happened. */
export async function sendTestPush() {
    const userId = await me();
    if (!userId) return { error: "Sign in first.", report: null };
    const report = await sendPushToUsers([userId], {
        title: "Inkference",
        body: "Push notifications are working. 🎉",
        url: "/inbox",
        tag: "test",
    });
    return { error: null, report };
}
