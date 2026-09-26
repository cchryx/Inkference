"use server";

import { prisma } from "@/lib/prisma";
import { notify, removeNotification } from "@/lib/notify";
import { APIError } from "better-auth/api";
import { getSession } from "@/lib/session";

export async function acceptFriendRequest(
    currentUserId: string,
    targetUserId: string
) {
    try {
        // Only the signed-in user can act as themselves.
        const session = await getSession();
        if (session?.user?.id !== currentUserId) return { error: "Unauthorized." };

        if (currentUserId === targetUserId) {
            return { error: "You cannot accept your own friend request." };
        }

        // Ensure both users exist
        const [targetUser, currentUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: targetUserId } }),
            prisma.user.findUnique({ where: { id: currentUserId } }),
        ]);
        if (!targetUser || !currentUser) {
            return { error: "User not found." };
        }

        // Ensure relationships exist
        let currentRel = await prisma.relationships.findUnique({
            where: { userId: currentUserId },
        });
        if (!currentRel) {
            currentRel = await prisma.relationships.create({
                data: { userId: currentUserId },
            });
        }

        let targetRel = await prisma.relationships.findUnique({
            where: { userId: targetUserId },
        });
        if (!targetRel) {
            targetRel = await prisma.relationships.create({
                data: { userId: targetUserId },
            });
        }

        // Check if a request was actually received by the current user
        const requestExists = await prisma.relationships.findFirst({
            where: {
                id: currentRel.id,
                friendRequestsReceived: { some: { id: targetRel.id } },
            },
        });

        if (!requestExists) {
            return { error: "No friend request to accept." };
        }

        // Accept friend request
        await Promise.all([
            prisma.relationships.update({
                where: { id: currentRel.id },
                data: {
                    friends: { connect: { id: targetRel.id } },
                    friendRequestsReceived: {
                        disconnect: { id: targetRel.id },
                    },
                },
            }),
            prisma.relationships.update({
                where: { id: targetRel.id },
                data: {
                    friends: { connect: { id: currentRel.id } },
                    friendRequestsSent: { disconnect: { id: currentRel.id } },
                },
            }),
        ]);

        // Tell them it was accepted, and clear the request notification.
        await Promise.all([
            notify({ recipientId: targetUserId, actorId: currentUserId, type: "friend_accept" }),
            removeNotification(currentUserId, "friend_request", targetUserId),
        ]);

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            let message = error.message?.trim() || "An unknown error occurred";
            message = message
                .split(/(?<=[.!?])\s+/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
            if (!/[.!?]$/.test(message)) message += ".";
            return { error: message };
        }

        return { error: "Internal server error." };
    }
}
