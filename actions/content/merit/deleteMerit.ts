"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserData } from "@/actions/users/getCurrentUserData";
import { APIError } from "better-auth/api";

export async function deleteMerit(meritId: string) {
    try {
        const userData = await getCurrentUserData();
        if (!userData || "error" in userData) return { error: "Unauthorized." };

        // Only deletes it if it belongs to the signed-in user.
        const { count } = await prisma.merit.deleteMany({
            where: { id: meritId, userDataId: userData.id },
        });
        if (!count) return { error: "You can't delete this merit." };

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
