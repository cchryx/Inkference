"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

/**
 * Save or unsave a post
 */
export async function savePost(postId: string, userId: string) {
    try {
        // Check if the post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { saves: { select: { userId: true } } },
        });
        if (!post) return { error: "Post not found." };

        // Ensure userData exists
        let userData = await prisma.userData.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!userData) {
            userData = await prisma.userData.create({ data: { userId } });
        }

        const alreadySaved = post.saves.some((u) => u.userId === userId);

        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                postsSaved: {
                    [alreadySaved ? "disconnect" : "connect"]: { id: postId },
                },
            },
        });

        return { error: null, saved: !alreadySaved };
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
