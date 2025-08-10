"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../getUserData";

export async function createPost(input: { type: string; dataId: string }) {
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
            },
        });

        return { error: null };
    } catch (error) {
        return { error: "Failed to create post." };
    }
}
