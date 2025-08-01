"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

type GalleryImageItem = {
    image: string;
    description: string;
};

export async function editProject(projectId: string, data: any) {
    try {
        // Check that project exists first
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!existingProject) {
            return { error: "Project not found." };
        }

        // Handle gallery images update if provided
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

        // Handle contributors update if provided
        if (Array.isArray(data.contributors)) {
            const contributorUserIds: string[] = data.contributors;

            // Get UserData IDs for those user IDs
            const userDatas = await prisma.userData.findMany({
                where: { userId: { in: contributorUserIds } },
                select: { id: true },
            });

            const userDataIds = userDatas.map((ud) => ud.id);

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    contributors: {
                        set:
                            userDataIds.length > 0
                                ? userDataIds.map((id) => ({ id }))
                                : [],
                    },
                },
            });

            delete data.contributors;
        }

        // Update any other remaining fields on the project
        if (Object.keys(data).length > 0) {
            await prisma.project.update({
                where: { id: projectId },
                data,
            });
        }

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

        console.error(error);
        return { error: "Internal server error." };
    }
}
