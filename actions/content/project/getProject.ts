"use server";

import { prisma } from "@/lib/prisma";

export async function getProjectById(projectId: string) {
    if (!projectId) return { error: "Missing project id." };

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            // Only public fields (never send emails etc. to the browser).
            userData: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
            contributors: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
            // Only who liked/saved (to know if *you* did), and just the view count.
            likes: { select: { userId: true } },
            saves: { select: { userId: true } },
            _count: { select: { views: true } },
            galleryImages: true,
            skills: {
                select: {
                    iconImage: true,
                    name: true,
                    id: true,
                },
            },
        },
    });

    if (!project) return { error: "Project not found." };
    return project;
}
