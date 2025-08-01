"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";

// Cooldown settings per field (in minutes)
const COOLDOWN_MINUTES: Record<string, number> = {
    name: 30 * 24 * 60,
    username: 90 * 24 * 60,
    image: 5,
};

export async function changeUserAction(formData: FormData, type: string) {
    let raw = formData.get(type);
    let value: any = raw !== null ? String(raw).trim() : "";

    const nullableFields = ["image"];

    if (!value && !nullableFields.includes(type)) {
        return {
            error: `${
                type.charAt(0).toUpperCase() + type.slice(1)
            } is required.`,
        };
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
                [type + "UpdatedAt"]: true,
                [type]: true,
            },
        });

        if (!user) return { error: "User not found." };

        if (user[type] === value) {
            return { error: `This is already your current ${type}.` };
        }

        const lastUpdated = user?.[`${type}UpdatedAt`];

        const cooldownMinutes = COOLDOWN_MINUTES[type] ?? 1440;
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (lastUpdated) {
            const elapsedMs = differenceInMilliseconds(
                new Date(),
                lastUpdated instanceof Date
                    ? lastUpdated
                    : typeof lastUpdated === "string" ||
                      typeof lastUpdated === "number"
                    ? new Date(lastUpdated)
                    : new Date()
            );

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
                    error: `You can change your ${type} again in ${timeLeft}.`,
                };
            }
        }

        if (type === "name") {
            value = normalizeName(value);

            if (!value.trim() || !/[a-zA-Z]/.test(value)) {
                return { error: "Name must contain at least one letter." };
            } else if (user.name === value) {
                return { error: "This is already your current name." };
            } else if (value.length > 50) {
                return { error: "Name cannot be longer than 50 characters." };
            }
        }

        if (["image", "username", "name"].includes(type)) {
            // Use better-auth's update method for these types
            await auth.api.updateUser({
                headers: await headers(),
                body: { [type]: value || null },
            });
        } else {
            // For other types, update directly with Prisma
            await prisma.user.update({
                where: { id: userId },
                data: {
                    [type]: value || null,
                    [`${type}UpdatedAt`]: new Date(),
                    id: userId,
                },
            });
        }

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
