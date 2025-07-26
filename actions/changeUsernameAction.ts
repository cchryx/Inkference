"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";
import { prisma } from "@/lib/prisma";

const USERNAME_COOLDOWN_MINUTES = 90 * 24 * 60; // 90 days

export async function changeUsernameAction(formData: FormData) {
    const username = String(formData.get("username"));
    if (!username) return { error: "Username is required." };

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const userId = session?.user?.id;
        if (!userId) return { error: "Unauthorized." };

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                usernameUpdatedAt: true,
            },
        });

        if (!user) return { error: "User not found." };

        if (user.username === username) {
            return { error: "This is already your current username." };
        }

        const lastUpdated = user.usernameUpdatedAt
            ? new Date(user.usernameUpdatedAt)
            : null;

        const cooldownMs = USERNAME_COOLDOWN_MINUTES * 60 * 1000;

        if (lastUpdated) {
            const elapsedMs = differenceInMilliseconds(new Date(), lastUpdated);

            if (elapsedMs < cooldownMs) {
                const remainingMs = cooldownMs - elapsedMs;

                const timeLeft = formatDistanceStrict(
                    new Date(),
                    new Date(Date.now() + remainingMs),
                    {
                        unit:
                            remainingMs < 60 * 1000
                                ? "second"
                                : remainingMs < 60 * 60 * 1000
                                ? "minute"
                                : remainingMs < 24 * 60 * 60 * 1000
                                ? "hour"
                                : "day",
                        roundingMethod: "ceil",
                    }
                );

                return {
                    error: `You can change your username again in ${timeLeft}.`,
                };
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                usernameUpdatedAt: new Date(),
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
