"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";
import { deleteUnusedUploads } from "@/lib/cleanupUploads";
import { APIError } from "better-auth/api";

export async function deleteProject(projectId: string) {
    try {
        const userData = await getCurrentUserData();
        if (!userData || "error" in userData) return { error: "Unauthorized." };

        // Remember its pictures so we can free the space after.
        const old = await prisma.project.findFirst({
            where: { id: projectId, userDataId: userData.id },
            select: { iconImage: true, bannerImage: true, galleryImages: { select: { image: true } } },
        });

        // Only deletes it if it belongs to the signed-in user.
        const { count } = await prisma.project.deleteMany({
            where: { id: projectId, userDataId: userData.id },
        });
        if (!count) return { error: "You can't delete this project." };

        if (old && userData.userId) {
            await deleteUnusedUploads(
                [old.iconImage, old.bannerImage, ...old.galleryImages.map((g) => g.image)],
                userData.userId
            ).catch(() => {});
        }

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            let message = error.message?.trim() || "An unknown error occurred.";
            message = message
                .split(/(?<=[.!?])\s+/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
            if (!/[.!?]$/.test(message)) message += ".";

            return { error: message };
        }

        return { error: "Internal server error." };
    }
}
