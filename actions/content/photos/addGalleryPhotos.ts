"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";
import { isOwnUpload } from "@/lib/uploads";

export async function addGalleryPhotos(input: {
    galleryId: string;
    photos: string[];
}) {
    const userData = await getCurrentUserData();
    if (!userData || "error" in userData) return { error: "Unauthorized." };

    try {
        const gallery = await prisma.gallery.findUnique({
            where: { id: input.galleryId },
            select: { userDataId: true },
        });
        if (!gallery || gallery.userDataId !== userData.id) {
            return { error: "You can't add photos to this gallery." };
        }

        const photos = (input.photos ?? []).filter((url) => isOwnUpload(url, userData.userId));
        if (!photos.length) return { error: "No valid photos to add." };

        await prisma.gallery.update({
            where: { id: input.galleryId },
            data: {
                photos: {
                    create: photos.map((url) => ({ image: url })),
                },
            },
        });

        return { error: null };
    } catch (error) {
        console.error(error);
        return { error: "Failed to add photos to gallery." };
    }
}
