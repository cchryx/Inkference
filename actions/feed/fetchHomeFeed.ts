"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type FeedItem = {
    type: string; // post type from DB
    content: any; // raw post data + author info + related data
};

function shuffleArray<T>(
    array: T[],
    lastTopItems: T[] = [],
    cooldownCount = 3
): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Prevent last top items from appearing too soon again
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

async function fetchPosts(whereClause: any, take: number, orderByClause: any) {
    return await prisma.post.findMany({
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
        },
    });
}

type FetchOptions = {
    cursor?: string;
    currentUserId?: string;
};

function buildWhereClause(excludedPostIds: Set<string>, cursor?: string): any {
    const where: any = {
        id: { notIn: Array.from(excludedPostIds) },
    };
    if (cursor) {
        where.id.lt = cursor;
    }
    return where;
}

// Helper: fetch related data by post type and dataId
async function fetchPostData(type: string, dataId: string) {
    switch (type) {
        case "project":
            return await prisma.project.findUnique({
                where: { id: dataId },
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
                    skills: {
                        select: {
                            iconImage: true,
                            name: true,
                            id: true,
                        },
                    },
                    likes: { select: { userId: true } },
                    saves: { select: { userId: true } },
                    views: { select: { userId: true } },
                },
            });
        // case "article":
        //     return await prisma.article.findUnique({
        //         where: { id: dataId },
        //     });
        // case "image":
        //     return await prisma.image.findUnique({
        //         where: { id: dataId },
        //     });
        // Add other types here as needed
        default:
            return null;
    }
}

async function fetchPostsByFriends(
    excludedPostIds: Set<string>,
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
        ...buildWhereClause(excludedPostIds, opts.cursor),
        userData: {
            userId: { in: friendIds },
        },
    };

    const posts = await fetchPosts(where, limit - feedItems.length, {
        updatedAt: "desc",
    });

    for (const p of posts) {
        const relatedData = await fetchPostData(p.type, p.dataId);
        feedItems.push({
            type: p.type,
            content: {
                ...p,
                author: p.userData?.user,
                data: relatedData,
            },
        });
        excludedPostIds.add(p.id);
    }
}

async function fetchPostsByFollowing(
    excludedPostIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (!opts?.currentUserId || feedItems.length >= limit) return;

    const following = await prisma.relationships.findUnique({
        where: { userId: opts.currentUserId },
        select: {
            following: { select: { userId: true } },
        },
    });

    const followingIds = following?.following.map((f) => f.userId) ?? [];
    if (followingIds.length === 0) return;

    const where = {
        ...buildWhereClause(excludedPostIds, opts?.cursor),
        userData: {
            userId: { in: followingIds },
        },
    };

    const posts = await fetchPosts(where, limit - feedItems.length, {
        updatedAt: "desc",
    });

    for (const p of posts) {
        const relatedData = await fetchPostData(p.type, p.dataId);
        feedItems.push({
            type: p.type,
            content: {
                ...p,
                author: p.userData?.user,
                data: relatedData,
            },
        });
        excludedPostIds.add(p.id);
    }
}

async function fetchRecentPosts(
    excludedPostIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const posts = await fetchPosts(
        buildWhereClause(excludedPostIds, opts?.cursor),
        limit - feedItems.length,
        { createdAt: "desc" }
    );

    for (const p of posts) {
        const relatedData = await fetchPostData(p.type, p.dataId);
        feedItems.push({
            type: p.type,
            content: {
                ...p,
                author: p.userData?.user,
                data: relatedData,
            },
        });
        excludedPostIds.add(p.id);
    }
}

async function fetchRandomPosts(
    excludedPostIds: Set<string>,
    limit: number,
    feedItems: FeedItem[],
    opts?: FetchOptions
) {
    if (feedItems.length >= limit) return;

    const posts = await fetchPosts(
        buildWhereClause(excludedPostIds, opts?.cursor),
        limit - feedItems.length,
        { updatedAt: "asc" }
    );

    for (const p of posts) {
        const relatedData = await fetchPostData(p.type, p.dataId);
        feedItems.push({
            type: p.type,
            content: {
                ...p,
                author: p.userData?.user,
                data: relatedData,
            },
        });
        excludedPostIds.add(p.id);
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

    const excludedPostIds = new Set<string>();
    const feedItems: FeedItem[] = [];

    const fetchers =
        feedType === "following"
            ? shuffleArray([fetchPostsByFollowing])
            : feedType === "friends"
            ? shuffleArray([fetchPostsByFriends])
            : shuffleArray([
                  fetchPostsByFriends,
                  fetchRecentPosts,
                  fetchRandomPosts,
              ]);

    let attempts = 0;
    const maxAttempts = fetchers.length * 3;

    while (feedItems.length < limit && attempts < maxAttempts) {
        const fetcher = fetchers[attempts % fetchers.length];
        const before = feedItems.length;

        await fetcher(excludedPostIds, limit, feedItems, {
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
