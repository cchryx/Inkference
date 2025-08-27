"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function deletePost(postId: string) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    try {
        // Fetch post and its photos
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { userData: true },
        });

        if (!post) {
            return { error: "Post not found." };
        }

        // Check if current user is owner
        if (post.userDataId !== userData.id) {
            return {
                error: "You do not have permission to delete this post.",
            };
        }

        // Delete photos from Cloudinary
        for (const photoURL of post.content) {
            if (photoURL) {
                const parts = photoURL.split("/");
                const fileName = parts.slice(-1)[0];
                const publicId = `${post.userData.userId}/posts/${
                    fileName.split(".")[0]
                }`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error("Cloudinary delete error:", err);
                    return {
                        error: `Failed to delete image from Cloudinary: ${photoURL}`,
                    };
                }
            }
        }

        // Delete post (and its photos via cascade)
        await prisma.post.delete({
            where: { id: postId },
        });

        return { error: null };
    } catch (err) {
        console.error(err);
        return { error: "Failed to delete post." };
    }
}
