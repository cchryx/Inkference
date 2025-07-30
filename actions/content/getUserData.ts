"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserData(userId?: string) {
    if (userId) {
        const userData = await prisma.userData.findUnique({
            where: { userId },
        });
        if (!userData) return { error: "User data not found." };
        return userData;
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const sessionUserId = session?.user?.id;
    if (!sessionUserId) return { error: "Unauthorized." };

    let userData = await prisma.userData.findUnique({
        where: { userId: sessionUserId },
    });

    if (!userData) {
        userData = await prisma.userData.create({
            data: { userId: sessionUserId },
        });
    }

    return userData;
}
