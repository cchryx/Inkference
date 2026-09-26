"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Lightweight: just the signed-in user's userData id (created if missing).
 * Use this in actions instead of getUserData(), which loads the whole profile.
 */
export async function getCurrentUserData() {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { error: "Unauthorized." };

    return prisma.userData.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true, userId: true },
    });
}
