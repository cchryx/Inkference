"use server";

import { prisma } from "@/lib/prisma";
import { notifyFriends } from "@/lib/notify";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";

type CreatePostInput = {
    type: string;
    dataId: string;
    content?: string[]; // optional, default empty array
    description?: string; // optional
    location?: string; // optional
    mentions?: string[]; // optional, default empty array
    tags?: string[]; // optional, default empty array
};

export async function createPost(input: CreatePostInput) {
    const userData = await getCurrentUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    try {
        const post = await prisma.post.create({
            data: {
                type: input.type,
                userDataId: userData.id,
                dataId: input.dataId,
                content: input.content || [],
                description: input.description,
                location: input.location,
                mentions: input.mentions || [],
                tags: input.tags || [],
            },
        });

        // Let the author's friends know about the new post.
        if (post.type === "post") {
            await notifyFriends(userData.userId, "friend_post", {
                targetType: "post",
                targetId: post.id,
            }, post.description);
        }

        return { error: null, post };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { error: "Failed to create post." };
    }
}
