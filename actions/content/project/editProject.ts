"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";

// The only project fields the edit screens are allowed to change.
const EDITABLE_FIELDS = [
    "name",
    "summary",
    "description",
    "projectLinks",
    "iconImage",
    "bannerImage",
    "status",
    "startDate",
    "endDate",
    "projectResources",
] as const;

type GalleryImageItem = {
    image: string;
    description: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function editProject(projectId: string, input: any) {
    try {
        const userData = await getCurrentUserData();
        if (!userData || "error" in userData) return { error: "Unauthorized." };

        // Only the owner can edit a project.
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userDataId: true },
        });

        if (!existingProject) {
            return { error: "Project not found." };
        }
        if (existingProject.userDataId !== userData.id) {
            return { error: "You can't edit this project." };
        }

        // Copy only the allowed fields (ignores things like userDataId).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};
        if (Array.isArray(input?.galleryImages)) data.galleryImages = input.galleryImages;
        if (Array.isArray(input?.contributors)) data.contributors = input.contributors;
        for (const key of EDITABLE_FIELDS) {
            if (input && key in input) data[key] = input[key];
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
                        image: String(item.image ?? ""),
                        description: String(item.description ?? ""),
                        projectId,
                    })),
                });
            }

            delete data.galleryImages;
        }

        // Handle contributors update if provided
        if (Array.isArray(data.contributors)) {
            // Keep only real accounts.
            const requested = (data.contributors as unknown[]).filter(
                (id): id is string => typeof id === "string"
            );
            const contributorUserIds = (
                await prisma.user.findMany({
                    where: { id: { in: requested } },
                    select: { id: true },
                })
            ).map((u) => u.id);

            // Step 1: Fetch existing userData entries
            const existingUserDatas = await prisma.userData.findMany({
                where: { userId: { in: contributorUserIds } },
                select: { id: true, userId: true },
            });

            const existingUserIdSet = new Set(
                existingUserDatas.map((ud) => ud.userId)
            );
            const missingUserIds = contributorUserIds.filter(
                (userId) => !existingUserIdSet.has(userId)
            );

            // Step 2: Create missing userData entries
            if (missingUserIds.length > 0) {
                await prisma.$transaction(
                    missingUserIds.map((userId) =>
                        prisma.userData.create({
                            data: {
                                userId,
                                // Add any default values for other required fields here if needed
                            },
                        })
                    )
                );
            }

            // Step 3: Fetch all userData IDs again (now all should exist)
            const allUserDatas = await prisma.userData.findMany({
                where: { userId: { in: contributorUserIds } },
                select: { id: true },
            });

            const userDataIds = allUserDatas.map((ud) => ud.id);

            // Step 4: Update contributors relation
            await prisma.project.update({
                where: {
                    id: projectId,
                },
                data: {
                    contributors: {
                        set: userDataIds.map((id) => ({ id })),
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
