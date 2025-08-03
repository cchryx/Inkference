"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function toggleFollowUser(
    followerUserId: string,
    targetUserId: string
) {
    try {
        if (followerUserId === targetUserId) {
            return { error: "You cannot follow yourself." };
        }

        // Ensure target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) return { error: "Target user not found." };

        // Ensure follower's Relationships record exists (create if missing)
        let followerRel = await prisma.relationships.findUnique({
            where: { userId: followerUserId },
            select: { id: true },
        });
        if (!followerRel) {
            followerRel = await prisma.relationships.create({
                data: { userId: followerUserId },
            });
        }

        // Ensure target's Relationships record exists (create if missing)
        let targetRel = await prisma.relationships.findUnique({
            where: { userId: targetUserId },
            select: { id: true },
        });
        if (!targetRel) {
            targetRel = await prisma.relationships.create({
                data: { userId: targetUserId },
            });
        }

        // Check if already following
        const isFollowing = await prisma.relationships.findFirst({
            where: {
                id: followerRel.id,
                following: { some: { id: targetRel.id } },
            },
        });

        // Toggle following connection
        await prisma.relationships.update({
            where: { id: followerRel.id },
            data: {
                following: {
                    [isFollowing ? "disconnect" : "connect"]: {
                        id: targetRel.id,
                    },
                },
            },
        });

        return { error: null, following: !isFollowing };
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
