"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

/**
 * Like or unlike a post
 */
export async function likePost(postId: string, userId: string) {
    try {
        // Check if the post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { likes: { select: { userId: true } } },
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

        const alreadyLiked = post.likes.some((u) => u.userId === userId);

        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                postsLiked: {
                    [alreadyLiked ? "disconnect" : "connect"]: { id: postId },
                },
            },
        });

        return { error: null, liked: !alreadyLiked };
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
