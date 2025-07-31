"use server";

import { prisma } from "@/lib/prisma";

export async function getProjectById(projectId: string) {
    if (!projectId) return { error: "Missing project id." };

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            userData: { include: { user: true } },
            contributors: { include: { user: true } },
            likes: true,
            galleryImages: true,
        },
    });

    if (!project) return { error: "Project not found." };
    return project;
}
