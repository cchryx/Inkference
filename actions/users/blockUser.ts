"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function me() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

async function relId(userId: string) {
    const rel = await prisma.relationships.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true },
    });
    return rel.id;
}

/**
 * Block someone: they can't see your posts/projects/galleries or profile,
 * can't follow you or send friend requests, and any follow/friendship
 * between you is removed (both ways).
 */
export async function blockUser(targetUserId: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    if (userId === targetUserId) return { error: "You can't block yourself." };

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) return { error: "User not found." };

    try {
        const [mine, theirs] = await Promise.all([relId(userId), relId(targetUserId)]);
        const cut = { disconnect: { id: theirs } };
        const cutMe = { disconnect: { id: mine } };

        await prisma.$transaction([
            prisma.relationships.update({
                where: { id: mine },
                data: {
                    blockedUsers: { connect: { id: theirs } },
                    following: cut,
                    followers: cut,
                    friends: cut,
                    friendOf: cut,
                    followRequestsSent: cut,
                    followRequestsReceived: cut,
                    friendRequestsSent: cut,
                    friendRequestsReceived: cut,
                },
            }),
            prisma.relationships.update({
                where: { id: theirs },
                data: { friends: cutMe, friendOf: cutMe },
            }),
            // Remove friend-request notifications between you.
            prisma.notification.deleteMany({
                where: {
                    OR: [
                        { recipientId: userId, actorIds: { has: targetUserId }, type: { in: ["friend_request", "friend_accept"] } },
                        { recipientId: targetUserId, actorIds: { has: userId }, type: { in: ["friend_request", "friend_accept"] } },
                    ],
                },
            }),
        ]);

        return { error: null };
    } catch (err) {
        console.error("blockUser failed:", err);
        return { error: "Couldn't block this user. Please try again." };
    }
}

export async function unblockUser(targetUserId: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };

    try {
        const [mine, theirs] = await Promise.all([relId(userId), relId(targetUserId)]);
        await prisma.relationships.update({
            where: { id: mine },
            data: { blockedUsers: { disconnect: { id: theirs } } },
        });
        return { error: null };
    } catch (err) {
        console.error("unblockUser failed:", err);
        return { error: "Couldn't unblock this user. Please try again." };
    }
}

/** People you've blocked (for Settings). */
export async function getBlockedUsers() {
    const userId = await me();
    if (!userId) return [];

    const rel = await prisma.relationships.findUnique({
        where: { userId },
        select: {
            blockedUsers: {
                select: { user: { select: { id: true, name: true, username: true, image: true } } },
            },
        },
    });
    return rel?.blockedUsers.map((b) => b.user) ?? [];
}
