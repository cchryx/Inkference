"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type FeedItem = {
    type: "project";
    content: any;
};

function shuffleArray<T>(
    array: T[],
    lastTopItems: T[] = [],
    cooldownCount = 3
): T[] {
    const shuffled = [...array];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Push last top items past cooldownCount index if found in the top cooldownCount positions
    for (let i = 0; i < cooldownCount; i++) {
        if (!shuffled[i]) break;
        if (lastTopItems.includes(shuffled[i])) {
            for (let k = cooldownCount; k < shuffled.length; k++) {
                if (!lastTopItems.includes(shuffled[k])) {
                    [shuffled[i], shuffled[k]] = [shuffled[k], shuffled[i]];
                    break;
                }
            }
        }
    }

    return shuffled;
}

async function fetchProjects(
    whereClause: any,
    take: number,
    orderByClause: any
) {
    return await prisma.project.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take,
        include: {
            userData: {
                select: {
                    user: {
                        select: {
                            name: true,
                            username: true,
                            image: true,
                        },
                    },
                },
            },
            likes: { select: { userId: true } },
            saves: { select: { userId: true } },
            views: { select: { userId: true } },
        },
    });
}

type FetchOptions = {
    cursor?: string;
    currentUserId?: string;
};

function buildWhereClause(
    excludedProjectIds: Set<string>,
    cursor?: string
): any {
    const where: any = {
        id: { notIn: Array.from(excludedProjectIds) },
    };
    if (cursor) {
        where.id.lt = cursor;
    }
    return where;
}

// ✅ Friends feed fetcher — only projects from friends
async function fetchProjectsByFriends(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (!opts?.currentUserId || feedItems.length >= limit) return;

    const relationships = await prisma.relationships.findUnique({
        where: { userId: opts.currentUserId },
        select: {
            friends: { select: { userId: true } },
        },
    });

    const friendIds = relationships?.friends.map((f) => f.userId) ?? [];
    if (friendIds.length === 0) return;

    const where = {
        ...buildWhereClause(excludedProjectIds, opts.cursor),
        userData: {
            userId: {
                in: friendIds,
            },
        },
    };

    const projects = await fetchProjects(where, limit - feedItems.length, {
        updatedAt: "desc",
    });

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

async function fetchProjectsByFollowing(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (!opts?.currentUserId || feedItems.length >= limit) return;

    const following = await prisma.relationships.findUnique({
        where: { userId: opts.currentUserId },
        select: {
            following: {
                select: { userId: true },
            },
        },
    });

    const followingIds = following?.following.map((f) => f.userId) ?? [];
    if (followingIds.length === 0) return;

    const where = {
        ...buildWhereClause(excludedProjectIds, opts?.cursor),
        userData: {
            userId: {
                in: followingIds,
            },
        },
    };

    const projects = await fetchProjects(where, limit - feedItems.length, {
        updatedAt: "desc",
    });

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

async function fetchPopularProjects(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const projects = await fetchProjects(
        buildWhereClause(excludedProjectIds, opts?.cursor),
        limit - feedItems.length,
        { likes: { _count: "desc" } }
    );

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

async function fetchRecentProjects(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const projects = await fetchProjects(
        buildWhereClause(excludedProjectIds, opts?.cursor),
        limit - feedItems.length,
        { createdAt: "desc" }
    );

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

async function fetchRandomProjects(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const projects = await fetchProjects(
        buildWhereClause(excludedProjectIds, opts?.cursor),
        limit - feedItems.length,
        { updatedAt: "asc" }
    );

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

export async function fetchHomeFeed({
    cursor,
    limit = 10,
    feedType = "foryou",
}: {
    cursor?: string;
    limit?: number;
    feedType?: "foryou" | "following" | "friends";
}): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;
    if (!currentUserId) throw new Error("Unauthorized.");

    // Ensure user exists in related tables
    await prisma.userData.upsert({
        where: { userId: currentUserId },
        update: {},
        create: { userId: currentUserId },
    });

    await prisma.relationships.upsert({
        where: { userId: currentUserId },
        update: {},
        create: { userId: currentUserId },
    });

    const excludedProjectIds = new Set<string>();
    const feedItems: FeedItem[] = [];

    // Select fetchers based on feedType
    const fetchers =
        feedType === "following"
            ? shuffleArray([fetchProjectsByFollowing])
            : feedType === "friends"
            ? shuffleArray([fetchProjectsByFriends])
            : shuffleArray([
                  fetchProjectsByFriends,
                  fetchPopularProjects,
                  fetchRecentProjects,
                  fetchRandomProjects,
              ]);

    let attempts = 0;
    const maxAttempts = fetchers.length * 3;

    while (feedItems.length < limit && attempts < maxAttempts) {
        const fetcher = fetchers[attempts % fetchers.length];
        const before = feedItems.length;

        await fetcher(excludedProjectIds, limit, feedItems, {
            cursor,
            currentUserId,
        });

        if (feedItems.length === before) attempts++;
        else attempts = 0;
    }

    const finalItems = feedItems.slice(0, limit);
    const lastItem = finalItems[finalItems.length - 1];

    return {
        items: finalItems,
        nextCursor:
            finalItems.length === limit ? lastItem.content.id : undefined,
    };
}
