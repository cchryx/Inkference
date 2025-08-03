"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getProfileData(username?: string | null) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let targetUserId: string;
    let userInfo: { name: string; username: string; image?: string };

    if (username) {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, name: true, username: true, image: true },
        });

        if (!user) {
            return {
                user: { name: "", username: "", image: undefined },
                profile: {
                    bio: "",
                    birthdate: null,
                    address: "",
                    socialLinks: [],
                    bannerImage: undefined,
                },
                relationships: null,
            };
        }

        targetUserId = user.id;
        userInfo = {
            name: user.name ?? "",
            username: user.username ?? "",
            image: user.image ?? undefined,
        };
    } else {
        if (!session) redirect("/auth/signin");

        targetUserId = session.user.id;
        userInfo = {
            name: session.user.name ?? "",
            username: session.user.username ?? "",
            image: session.user.image ?? undefined,
        };
    }

    const [profile, relationships] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId: targetUserId },
            select: {
                bio: true,
                birthdate: true,
                address: true,
                socialLinks: true,
                bannerImage: true,
            },
        }),
        prisma.relationships.findUnique({
            where: { userId: targetUserId },
            select: {
                id: true,
                isPrivate: true,
                followers: {
                    select: { userId: true },
                },
                following: {
                    select: { userId: true },
                },
                friends: {
                    select: { userId: true },
                },
                blockedUsers: {
                    select: { userId: true },
                },
                followRequestsReceived: {
                    select: { userId: true },
                },
                followRequestsSent: {
                    select: { userId: true },
                },
                friendRequestsReceived: {
                    select: { userId: true },
                },
                friendRequestsSent: {
                    select: { userId: true },
                },
            },
        }),
    ]);

    return {
        user: {
            name: userInfo.name,
            username: userInfo.username,
            image: userInfo.image,
        },
        profile: {
            bio: profile?.bio ?? "",
            birthdate: profile?.birthdate ?? null,
            address: profile?.address ?? "",
            socialLinks: profile?.socialLinks ?? [],
            bannerImage: profile?.bannerImage ?? undefined,
        },
        relationships: relationships ?? null,
    };
}
