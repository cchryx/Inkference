"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Lightweight: just the signed-in user's userData id (created if missing).
 * Use this in actions instead of getUserData(), which loads the whole profile.
 */
export async function getCurrentUserData() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return { error: "Unauthorized." };

    return prisma.userData.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true, userId: true },
    });
}
