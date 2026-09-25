"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

const personSelect = {
    select: {
        userId: true,
        user: { select: { username: true, name: true, image: true } },
    },
} as const;

const relationshipsSelect = {
    id: true,
    isPrivate: true,
    followers: personSelect,
    following: personSelect,
    friends: personSelect,
    blockedUsers: { select: { userId: true } },
    followRequestsReceived: personSelect,
    followRequestsSent: personSelect,
    friendRequestsReceived: personSelect,
    friendRequestsSent: personSelect,
} as const;

export async function getProfileData(username?: string | null) {
    let userInfo: { id: string; name: string; username: string; image?: string };

    if (username) {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, name: true, username: true, image: true },
        });

        if (!user) {
            return {
                user: { id: "", name: "", username: "", image: undefined },
                profile: {
                    bio: "",
                    birthdate: null,
                    address: "",
                    socialLinks: [] as string[],
                    bannerImage: undefined,
                },
                relationships: null,
            };
        }

        userInfo = {
            id: user.id,
            name: user.name ?? "",
            username: user.username ?? "",
            image: user.image ?? undefined,
        };
    } else {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) redirect("/auth/signin");

        userInfo = {
            id: session.user.id,
            name: session.user.name ?? "",
            username: session.user.username ?? "",
            image: session.user.image ?? undefined,
        };
    }

    // Both at the same time. upsert = create the row if it doesn't exist yet.
    const [relationships, profile] = await Promise.all([
        prisma.relationships.upsert({
            where: { userId: userInfo.id },
            update: {},
            create: { userId: userInfo.id },
            select: relationshipsSelect,
        }),
        prisma.profile.findUnique({
            where: { userId: userInfo.id },
            select: {
                bio: true,
                birthdate: true,
                address: true,
                socialLinks: true,
                bannerImage: true,
            },
        }),
    ]);

    return {
        user: userInfo,
        profile: {
            bio: profile?.bio ?? "",
            birthdate: profile?.birthdate ?? null,
            address: profile?.address ?? "",
            socialLinks: profile?.socialLinks ?? [],
            bannerImage: profile?.bannerImage ?? undefined,
        },
        relationships,
    };
}

/**
 * Tiny query for link previews (Discord, iMessage...). Cached for 5 minutes
 * across requests, so repeated shares of the same profile are instant.
 */
export async function getProfileMeta(username: string) {
    return unstable_cache(
        async () =>
            prisma.user.findUnique({
                where: { username },
                select: {
                    name: true,
                    username: true,
                    image: true,
                    Profile: { select: { bio: true, bannerImage: true } },
                },
            }),
        ["profile-meta", username],
        { revalidate: 300 }
    )();
}
