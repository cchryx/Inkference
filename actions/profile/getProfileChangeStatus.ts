"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";

type UserChangeType = "name" | "username" | "image";
type ProfileChangeType =
    | "bio"
    | "birthdate"
    | "address"
    | "bannerImage"
    | "phoneNumber"
    | "socialLinks";
type ChangeType = UserChangeType | ProfileChangeType;

// Limit in minutes
const LIMITS: Record<ChangeType, number> = {
    name: 30 * 24 * 60,
    username: 90 * 24 * 60,
    image: 5,
    bio: 5,
    birthdate: 120 * 24 * 60,
    address: 7 * 24 * 60,
    phoneNumber: 1 * 24 * 60,
    socialLinks: 5,
    bannerImage: 5,
};

export async function getProfileChangeStatus(type: ChangeType) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userId = session?.user?.id;
    if (!userId) return { canChange: false, timeLeft: null };

    const updatedAtField = `${type}UpdatedAt` as string;
    const limitMinutes = LIMITS[type] ?? 60; // default 1 hour
    const limitMs = limitMinutes * 60 * 1000;

    let lastUpdated: Date | null = null;

    if (type === "name" || type === "username" || type === "image") {
        const user = (await prisma.user.findUnique({
            where: { id: userId },
            select: { [updatedAtField]: true },
        })) as Record<string, Date | null> | null;

        lastUpdated = user?.[updatedAtField] ?? null;
    } else {
        const profile = (await prisma.profile.findUnique({
            where: { userId },
            select: { [updatedAtField]: true },
        })) as Record<string, Date | null> | null;

        lastUpdated = profile?.[updatedAtField] ?? null;
    }

    if (!lastUpdated) {
        return { canChange: true, timeLeft: null };
    }

    const now = new Date();
    const elapsedMs = now.getTime() - new Date(lastUpdated).getTime();
    const remainingMs = limitMs - elapsedMs;

    if (remainingMs <= 0) {
        return { canChange: true, timeLeft: null };
    }

    let unit: "second" | "minute" | "hour" | "day" = "minute";
    if (remainingMs < 60 * 1000) unit = "second";
    else if (remainingMs < 60 * 60 * 1000) unit = "minute";
    else if (remainingMs < 24 * 60 * 60 * 1000) unit = "hour";
    else unit = "day";

    return {
        canChange: false,
        timeLeft: formatDistanceStrict(
            now,
            new Date(now.getTime() + remainingMs),
            {
                unit,
                roundingMethod: "ceil",
            }
        ),
    };
}
