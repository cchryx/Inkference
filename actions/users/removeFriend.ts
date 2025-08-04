"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function removeFriend(
    targetUserId: string,
    currentUserId: string
) {
    try {
        if (currentUserId === targetUserId) {
            return { error: "You cannot unfriend yourself." };
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
        const [currentRel, targetRel] = await Promise.all([
            prisma.relationships.findUnique({
                where: { userId: currentUserId },
            }),
            prisma.relationships.findUnique({
                where: { userId: targetUserId },
            }),
        ]);

        if (!currentRel || !targetRel) {
            return { error: "No existing friendship to remove." };
        }

        // Check if they are currently friends
        const areFriends = await prisma.relationships.findFirst({
            where: {
                id: currentRel.id,
                friends: { some: { id: targetRel.id } },
            },
        });

        if (!areFriends) {
            return { error: "You are not friends with this user." };
        }

        // Disconnect both users from each other's friends
        await Promise.all([
            prisma.relationships.update({
                where: { id: currentRel.id },
                data: {
                    friends: { disconnect: { id: targetRel.id } },
                },
            }),
            prisma.relationships.update({
                where: { id: targetRel.id },
                data: {
                    friends: { disconnect: { id: currentRel.id } },
                },
            }),
        ]);

        return { error: null, unfriended: true };
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
