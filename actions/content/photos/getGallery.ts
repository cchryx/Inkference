"use server";

import { prisma } from "@/lib/prisma";

export async function getGalleryById(galleryId: string) {
    if (!galleryId) return { error: "Missing gallery id." };

    const gallery = await prisma.gallery.findUnique({
        where: { id: galleryId },
        include: {
            userData: {
                include: {
                    galleries: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                        },
                    },
                },
            },
            photos: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!gallery) return { error: "Gallery not found." };

    return gallery;
}
