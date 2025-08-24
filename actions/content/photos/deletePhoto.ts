"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function deletePhoto(photoId: string) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    try {
        // Fetch photo with its gallery and owner
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
            include: { gallery: { include: { userData: true } } },
        });

        if (!photo) {
            return { error: "Photo not found." };
        }

        // Check ownership
        if (photo.gallery.userDataId !== userData.id) {
            return {
                error: "You do not have permission to delete this photo.",
            };
        }

        // Delete from Cloudinary
        if (photo.image) {
            // Assuming Cloudinary path: <userId>/photos/<file>.ext
            const parts = photo.image.split("/");
            const fileName = parts[parts.length - 1];
            const publicId = `${photo.gallery.userData.userId}/photos/${
                fileName.split(".")[0]
            }`;

            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                return {
                    error: `Failed to delete image from Cloudinary: ${photo.image}`,
                };
            }
        }

        // Delete from database
        await prisma.photo.delete({
            where: { id: photoId },
        });

        return { error: null };
    } catch (err) {
        console.error(err);
        return { error: "Failed to delete photo." };
    }
}
