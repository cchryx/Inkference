"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function saveProject(projectId: string, userId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { saves: { select: { userId: true } } },
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

        const alreadySaved = project.saves.some((u) => u.userId === userId);

        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                projectsSaved: {
                    [alreadySaved ? "disconnect" : "connect"]: {
                        id: projectId,
                    },
                },
            },
        });

        return { error: null, saved: !alreadySaved };
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
