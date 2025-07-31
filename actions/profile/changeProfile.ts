"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";
import { prisma } from "@/lib/prisma";

// Cooldown settings per field (in minutes)
const COOLDOWN_MINUTES: Record<string, number> = {
    bio: 5,
    birthdate: 120 * 24 * 60,
    address: 7 * 24 * 60,
    socialLinks: 5,
    bannerImage: 5,
};

export async function changeProfileAction(formData: FormData, type: string) {
    let raw = formData.get(type);
    let value: any = raw !== null ? String(raw).trim() : "";

    const nullableFields = ["bannerImage", "bio", "location"];

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

        const profile = await prisma.profile.findFirst({
            where: { userId },
            select: {
                [type + "UpdatedAt"]: true,
                [type]: true,
            },
        });

        const lastUpdated = profile?.[`${type}UpdatedAt`] ?? null;

        const cooldownMinutes = COOLDOWN_MINUTES[type] ?? 1440;
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (lastUpdated) {
            const elapsedMs = differenceInMilliseconds(
                new Date(),
                typeof lastUpdated === "object" &&
                    lastUpdated !== null &&
                    (lastUpdated as object) instanceof Date
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

        if (type === "birthdate") {
            value = Number(value);
        } else if (type === "socialLinks") {
            try {
                const parsed = JSON.parse(value);
                if (
                    Array.isArray(parsed) &&
                    parsed.every((v) => typeof v === "string")
                ) {
                    value = parsed;
                } else {
                    return { error: "Invalid social links format." };
                }
            } catch {
                return { error: "Failed to parse social links." };
            }
        }

        await prisma.profile.upsert({
            where: { userId },
            create: {
                [type]: value || null,
                [`${type}UpdatedAt`]: new Date(),
                userId,
            },
            update: {
                [type]: value || null,
                [`${type}UpdatedAt`]: new Date(),
            },
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
