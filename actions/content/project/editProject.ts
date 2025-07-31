"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";

export async function editProject(projectId: string, data: any) {
    try {
        await prisma.project.update({
            where: { id: projectId },
            data,
        });

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

        return { error: "Internal server error." };
    }
}
