"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notify } from "@/lib/notify";
import { isBlockedBetween } from "@/lib/visibility";
import { APIError } from "better-auth/api";

export async function toggleFollowUser(
    followerUserId: string,
    targetUserId: string
) {
    try {
        // Only the signed-in user can act as themselves.
        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user?.id !== followerUserId) return { error: "Unauthorized." };

        if (await isBlockedBetween(followerUserId, targetUserId)) {
            return { error: "You can't do that with this user." };
        }

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

        if (!isFollowing) {
            await notify({ recipientId: targetUserId, actorId: followerUserId, type: "follow" });
        }

        return { error: null, following: !isFollowing };
    } catch (error) {
        if (error instanceof APIError) {
            let message = error.message?.trim() || "An unknown error occurred.";
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
