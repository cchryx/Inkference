"use server";

import { prisma } from "@/lib/prisma";

export async function addGalleryPhotos(input: {
    galleryId: string;
    photos: string[];
}) {
    try {
        await prisma.gallery.update({
            where: { id: input.galleryId },
            data: {
                photos: {
                    create: input.photos.map((url) => ({ image: url })),
                },
            },
        });

        return { error: null };
    } catch (error) {
        console.error(error);
        return { error: "Failed to add photos to gallery." };
    }
}
