"use server";

import { prisma } from "@/lib/prisma";
import { notifyFriends } from "@/lib/notify";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";
import { isOwnUpload } from "@/lib/uploads";

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

    if (input.type !== "post" && input.type !== "project") {
        return { error: "Unknown post type." };
    }

    // Sharing a project: it has to be yours (or one you worked on).
    if (input.type === "project") {
        const project = await prisma.project.findFirst({
            where: {
                id: input.dataId,
                OR: [
                    { userDataId: userData.id },
                    { contributors: { some: { id: userData.id } } },
                ],
            },
            select: { id: true },
        });
        if (!project) return { error: "You can only share your own projects." };
    }

    // Photo posts can only use photos this user uploaded.
    const content = (input.content ?? []).filter(
        (url) => input.type !== "post" || isOwnUpload(url, userData.userId)
    );
    if (input.type === "post" && !content.length) {
        return { error: "Add at least one photo." };
    }

    try {
        const post = await prisma.post.create({
            data: {
                type: input.type,
                userDataId: userData.id,
                dataId: input.dataId,
                content,
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
