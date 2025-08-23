"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function deleteGallery(galleryId: string) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    try {
        // Fetch gallery and its photos
        const gallery = await prisma.gallery.findUnique({
            where: { id: galleryId },
            include: { photos: true, userData: true },
        });

        if (!gallery) {
            return { error: "Gallery not found." };
        }

        // Check if current user is owner
        if (gallery.userDataId !== userData.id) {
            return {
                error: "You do not have permission to delete this gallery.",
            };
        }

        // Delete photos from Cloudinary
        for (const photo of gallery.photos) {
            console.log(photo.image);
            console.log(gallery.userDataId);
            if (photo.image) {
                // Extract public ID from URL (assuming default Cloudinary URL format)
                const parts = photo.image.split("/");
                const publicIdWithExt = parts.slice(-1)[0]; // last part
                const publicId = `${gallery.userData.userId}/photos/${
                    publicIdWithExt.split(".")[0]
                }`;

                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error(
                        `Failed to delete image from Cloudinary: ${photo.image}`,
                        err
                    );
                }
            }
        }

        // Delete gallery (and its photos via cascade)
        await prisma.gallery.delete({
            where: { id: galleryId },
        });

        return { error: null };
    } catch (err) {
        console.error(err);
        return { error: "Failed to delete gallery." };
    }
}
