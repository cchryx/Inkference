"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";

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
    const userData = await getUserData();

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

        return { error: null, post };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { error: "Failed to create post." };
    }
}
