"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type FeedItem = {
    type: "project";
    content: any; // raw project object from Prisma, including author info
};

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
            likes: { select: { id: true } },
            saves: { select: { id: true } },
            views: { select: { id: true } },
        },
    });
}

// Shared options type
type FetchOptions = {
    cursor?: string;
};

// Shared filtering helper
function buildWhereClause(
    excludedProjectIds: Set<string>,
    cursor?: string
): any {
    const where: any = {
        id: {
            notIn: Array.from(excludedProjectIds),
        },
    };
    if (cursor) {
        where.id.lt = cursor; // assumes project IDs are ordered
    }
    return where;
}

export async function fetchProjectsByFriends(
    excludedProjectIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const projects = await fetchProjects(
        buildWhereClause(excludedProjectIds, opts?.cursor),
        limit - feedItems.length,
        { updatedAt: "desc" }
    );

    for (const p of projects) {
        feedItems.push({
            type: "project",
            content: { ...p, author: p.userData?.user },
        });
        excludedProjectIds.add(p.id);
    }
}

export async function fetchPopularProjects(
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

export async function fetchRecentProjects(
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

export async function fetchRandomProjects(
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

export async function fetchForYouFeed({
    cursor,
    limit = 10,
}: {
    cursor?: string;
    limit?: number;
}): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;
    if (!currentUserId) throw new Error("Unauthorized");

    await prisma.userData.upsert({
        where: { userId: currentUserId },
        update: {},
        create: { userId: currentUserId },
    });

    await prisma.relationships.upsert({
        where: { userId: currentUserId },
        update: {},
        create: { userId: currentUserId },
        include: {
            friends: { select: { user: { select: { id: true } } } },
            following: { select: { user: { select: { id: true } } } },
        },
    });

    const excludedProjectIds = new Set<string>();
    const feedItems: FeedItem[] = [];

    const fetchers = shuffleArray([
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

        await fetcher(excludedProjectIds, limit, feedItems, { cursor });

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
