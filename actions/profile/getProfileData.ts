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
    let userInfo: {
        id: string;
        name: string;
        username: string;
        image?: string;
    };

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
                    socialLinks: [],
                    bannerImage: undefined,
                },
                relationships: null,
            };
        }

        targetUserId = user.id;
        userInfo = {
            id: user.id ?? "",
            name: user.name ?? "",
            username: user.username ?? "",
            image: user.image ?? undefined,
        };
    } else {
        if (!session) redirect("/auth/signin");

        targetUserId = session.user.id;
        userInfo = {
            id: session.user.id ?? "",
            name: session.user.name ?? "",
            username: session.user.username ?? "",
            image: session.user.image ?? undefined,
        };
    }

    // 🟦 Ensure relationships entry exists
    let relationships = await prisma.relationships.findUnique({
        where: { userId: targetUserId },
        select: {
            id: true,
            isPrivate: true,
            followers: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            following: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            friends: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            blockedUsers: {
                select: { userId: true },
            },
            followRequestsReceived: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            followRequestsSent: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            friendRequestsReceived: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            friendRequestsSent: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            username: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    });

    if (!relationships) {
        await prisma.relationships.create({
            data: {
                userId: targetUserId,
            },
        });

        // Refetch with proper select
        relationships = await prisma.relationships.findUnique({
            where: { userId: targetUserId },
            select: {
                id: true,
                isPrivate: true,
                followers: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                following: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                friends: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                blockedUsers: {
                    select: { userId: true },
                },
                followRequestsReceived: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                followRequestsSent: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                friendRequestsReceived: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                friendRequestsSent: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: {
            bio: true,
            birthdate: true,
            address: true,
            socialLinks: true,
            bannerImage: true,
        },
    });

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
