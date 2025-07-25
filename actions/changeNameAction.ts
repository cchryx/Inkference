"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { normalizeName } from "@/lib/utils";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { differenceInDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function changeNameAction(formData: FormData) {
    const name = String(formData.get("name"));
    if (!name) return { error: "Name is required." };

    const normalizedName = normalizeName(name);

    if (!normalizedName.trim() || !/[a-zA-Z]/.test(normalizedName)) {
        return { error: "Name must contain at least one letter." };
    }

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const userId = session?.user?.id;
        if (!userId) return { error: "Unauthorized." };

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                nameUpdatedAt: true,
                name: true,
            },
        });

        if (!user) return { error: "User not found." };

        if (user.name === normalizedName) {
            return { error: "This is already your current name." };
        }

        const lastUpdated = user.nameUpdatedAt
            ? new Date(user.nameUpdatedAt)
            : null;

        if (lastUpdated) {
            const daysSinceUpdate = differenceInDays(new Date(), lastUpdated);
            if (daysSinceUpdate < 30) {
                const daysLeft = 30 - daysSinceUpdate;
                return {
                    error: `You can change your name again in ${daysLeft} day(s).`,
                };
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                name: normalizedName,
                nameUpdatedAt: new Date(),
            },
        });

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            const errorCode = error.body
                ? (error.body.code as ErrorCode)
                : "UNKNOWN";

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
