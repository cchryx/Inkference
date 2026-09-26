"use server";

import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { forgetUploads } from "@/lib/storage";
import { getSession } from "@/lib/session";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_GALLERY_NAME = 100;

// Same path the uploader uses: <userId>/photos/<file>.ext
function cloudinaryPublicId(userId: string, imageUrl: string) {
    const fileName = imageUrl.split("/").pop() ?? "";
    return `${userId}/photos/${fileName.split(".")[0]}`;
}

/**
 * Renames a gallery and/or removes photos from it (also deletes the removed
 * photos from Cloudinary).
 */
export async function editGallery(
    galleryId: string,
    input: { name: string; removePhotoIds: string[] }
) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { error: "Unauthorized." };

    const name = input.name?.trim() ?? "";
    if (!name) return { error: "Please enter a gallery name." };
    if (name.length > MAX_GALLERY_NAME) {
        return {
            error: `Gallery name can't be longer than ${MAX_GALLERY_NAME} characters.`,
        };
    }

    try {
        const gallery = await prisma.gallery.findUnique({
            where: { id: galleryId },
            select: { userData: { select: { userId: true } } },
        });
        if (!gallery) return { error: "Gallery not found." };
        if (gallery.userData.userId !== userId) {
            return { error: "You do not have permission to edit this gallery." };
        }

        // Only photos that really belong to this gallery.
        const photosToRemove = input.removePhotoIds.length
            ? await prisma.photo.findMany({
                  where: { id: { in: input.removePhotoIds }, galleryId },
                  select: { id: true, image: true },
              })
            : [];

        // Delete the image files first (in batches of 100, Cloudinary's limit).
        const publicIds = photosToRemove
            .filter((p) => p.image)
            .map((p) => cloudinaryPublicId(userId, p.image));

        for (let i = 0; i < publicIds.length; i += 100) {
            try {
                await cloudinary.api.delete_resources(
                    publicIds.slice(i, i + 100)
                );
            } catch (err) {
                console.error("Cloudinary delete failed:", err);
                return {
                    error: "Failed to delete photos from storage. Please try again.",
                };
            }
        }

        await prisma.$transaction([
            prisma.gallery.update({
                where: { id: galleryId },
                data: { name },
            }),
            prisma.photo.deleteMany({
                where: { id: { in: photosToRemove.map((p) => p.id) }, galleryId },
            }),
        ]);

        await forgetUploads(photosToRemove.map((p) => p.image)).catch(() => {});

        return { error: null, removed: photosToRemove.length };
    } catch (err) {
        console.error(err);
        return { error: "Failed to update gallery." };
    }
}
