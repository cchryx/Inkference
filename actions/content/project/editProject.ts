"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

type GalleryImageItem = {
    image: string;
    description: string;
};

export async function editProject(projectId: string, data: any) {
    try {
        if (Array.isArray(data.galleryImages)) {
            const galleryItems = data.galleryImages;

            await prisma.projectGalleryImage.deleteMany({
                where: { projectId },
            });

            if (galleryItems.length > 0) {
                await prisma.projectGalleryImage.createMany({
                    data: galleryItems.map((item: GalleryImageItem) => ({
                        image: item.image,
                        description: item.description,
                        projectId,
                    })),
                });
            }

            delete data.galleryImages;
        }

        await prisma.project.update({
            where: { id: projectId },
            data,
        });

        return { error: null };
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

        console.log(error);
        return { error: "Internal server error." };
    }
}
