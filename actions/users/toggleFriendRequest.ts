"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function toggleFriendRequest(
    senderUserId: string,
    targetUserId: string
) {
    try {
        if (senderUserId === targetUserId) {
            return { error: "You cannot send a friend request to yourself." };
        }

        // Ensure target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) return { error: "Target user not found." };

        // Ensure sender has Relationships
        let senderRel = await prisma.relationships.findUnique({
            where: { userId: senderUserId },
            select: { id: true },
        });
        if (!senderRel) {
            senderRel = await prisma.relationships.create({
                data: { userId: senderUserId },
            });
        }

        // Ensure target has Relationships
        let targetRel = await prisma.relationships.findUnique({
            where: { userId: targetUserId },
            select: { id: true },
        });
        if (!targetRel) {
            targetRel = await prisma.relationships.create({
                data: { userId: targetUserId },
            });
        }

        // Check if already friends
        const alreadyFriends = await prisma.relationships.findFirst({
            where: {
                id: senderRel.id,
                friends: { some: { id: targetRel.id } },
            },
        });
        if (alreadyFriends) {
            return { error: "You are already friends." };
        }

        // Check if friend request is already sent
        const requestExists = await prisma.relationships.findFirst({
            where: {
                id: senderRel.id,
                friendRequestsSent: { some: { id: targetRel.id } },
            },
        });

        if (requestExists) {
            // Cancel friend request
            await prisma.relationships.update({
                where: { id: senderRel.id },
                data: {
                    friendRequestsSent: {
                        disconnect: { id: targetRel.id },
                    },
                },
            });
            return { error: null, requested: false };
        } else {
            // Send friend request
            await prisma.relationships.update({
                where: { id: senderRel.id },
                data: {
                    friendRequestsSent: {
                        connect: { id: targetRel.id },
                    },
                },
            });
            return { error: null, requested: true };
        }
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
