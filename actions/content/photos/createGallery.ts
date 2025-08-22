"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";

export async function createGallery(input: { name: string; photos: string[] }) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    try {
        await prisma.gallery.create({
            data: {
                name: input.name,
                userDataId: userData.id,
                photos: {
                    create: input.photos.map((url) => ({ image: url })),
                },
            },
        });

        return { error: null };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create gallery." };
    }
}
