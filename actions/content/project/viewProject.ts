"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function viewProject(projectId: string, userId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!project) {
            return { error: "Project not found." };
        }

        let userData = await prisma.userData.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!userData) {
            userData = await prisma.userData.create({
                data: { userId },
            });
        }

        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                projectsViewed: {
                    connect: { id: projectId },
                },
            },
        });

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
