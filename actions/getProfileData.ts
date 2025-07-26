"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getProfileData(username?: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/auth/signin");

    let targetUserId: string;
    let userInfo: { name: string; username: string };

    if (username) {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, name: true, username: true },
        });

        if (!user) {
            // Return with default empty fields instead of null
            return {
                user: { name: "", username: "" },
                profile: {
                    bio: "",
                    birthdate: null,
                    address: "",
                    socialLinks: [],
                },
            };
        }

        targetUserId = user.id;
        userInfo = {
            name: user.name ?? "",
            username: user.username ?? "",
        };
    } else {
        targetUserId = session.user.id;
        userInfo = {
            name: session.user.name ?? "",
            username: session.user.username ?? "",
        };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: {
            bio: true,
            birthdate: true,
            address: true,
            socialLinks: true,
        },
    });

    return {
        user: {
            name: userInfo.name,
            username: userInfo.username,
        },
        profile: {
            bio: profile?.bio ?? "",
            birthdate: profile?.birthdate ?? null,
            address: profile?.address ?? "",
            socialLinks: profile?.socialLinks ?? [],
        },
    };
}
