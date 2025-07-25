"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";

type ChangeType = "name" | "username";

const LIMITS: Record<ChangeType, number> = {
    name: 30,
    username: 90,
};

export async function getProfileChangeStatus(type: ChangeType) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userId = session?.user?.id;
    if (!userId) return { canChange: false, timeLeft: null };

    const field =
        type === "name" ? "nameUpdatedAt" : ("usernameUpdatedAt" as const);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { [field]: true },
    });

    const lastUpdated: any = user?.[field];
    if (!lastUpdated) return { canChange: true, timeLeft: null };

    const now = new Date();
    const then = new Date(lastUpdated);
    const elapsedMs = differenceInMilliseconds(now, then);
    const limitMs = LIMITS[type] * 24 * 60 * 60 * 1000;

    const remainingMs = limitMs - elapsedMs;

    if (remainingMs <= 0) return { canChange: true, timeLeft: null };

    return {
        canChange: false,
        timeLeft: formatDistanceStrict(
            now,
            new Date(now.getTime() + remainingMs),
            {
                unit: remainingMs < 1000 * 60 * 60 * 24 ? "hour" : "day",
                roundingMethod: "ceil",
            }
        ),
    };
}
