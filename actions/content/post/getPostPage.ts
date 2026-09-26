"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentViewer, visiblePosts } from "@/lib/visibility";
import { getSession } from "@/lib/session";

// Used when the viewer isn't signed in, so "did I like it" never matches.
const NO_USER = "00000000-0000-0000-0000-000000000000";

async function getMyUserDataId() {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const userData = await prisma.userData.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    return { userId: session.user.id, userDataId: userData?.id ?? null };
}

/**
 * Everything the post page needs, in one query.
 */
export async function getPostPage(postId: string) {
    if (!postId) return null;

    const [me, viewer] = await Promise.all([getMyUserDataId(), getCurrentViewer()]);
    const myId = me?.userDataId ?? NO_USER;

    // Hidden posts look exactly like missing ones (no hint they exist).
    const post = await prisma.post.findFirst({
        where: { AND: [{ id: postId }, visiblePosts(viewer)] },
        select: {
            id: true,
            type: true,
            dataId: true,
            content: true,
            description: true,
            location: true,
            tags: true,
            createdAt: true,
            userData: {
                select: {
                    user: {
                        select: { id: true, name: true, username: true, image: true },
                    },
                },
            },
            _count: { select: { likes: true, saves: true, views: true, comments: true } },
            likes: { where: { id: myId }, select: { id: true } },
            saves: { where: { id: myId }, select: { id: true } },
        },
    });
    if (!post) return null;

    const { likes, saves, _count, userData, ...rest } = post;

    return {
        post: {
            ...rest,
            author: userData.user,
            stats: {
                likes: _count.likes,
                saves: _count.saves,
                views: _count.views,
                comments: _count.comments,
                liked: likes.length > 0,
                saved: saves.length > 0,
            },
        },
        currentUserId: me?.userId ?? null,
    };
}

export type PostPageData = NonNullable<Awaited<ReturnType<typeof getPostPage>>>;

/**
 * "More posts like this"
 *
 * Candidates come from a few signals and are scored:
 *   - shared tags            +10 per tag (the strongest signal)
 *   - same location          +6
 *   - same author            +4
 *   - popular recent posts   small bonus by likes (fallback)
 * The best matches come first; ties are shuffled a little so the list
 * doesn't feel identical every visit.
 */
export async function getSimilarPosts(
    post: { id: string; tags: string[]; location: string | null; authorId: string },
    limit = 15
) {
    const viewer = await getCurrentViewer();
    const base = { AND: [{ id: { not: post.id }, type: "post" }, visiblePosts(viewer)] };
    const select = {
        id: true,
        content: true,
        tags: true,
        location: true,
        createdAt: true,
        userData: { select: { userId: true } },
        _count: { select: { likes: true, saves: true, views: true } },
    } as const;

    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [byTags, byLocation, byAuthor, popular] = await Promise.all([
        post.tags.length
            ? prisma.post.findMany({
                  where: { ...base, tags: { hasSome: post.tags } },
                  orderBy: { createdAt: "desc" },
                  select,
                  take: 60,
              })
            : Promise.resolve([]),
        post.location
            ? prisma.post.findMany({
                  where: { ...base, location: post.location },
                  orderBy: { createdAt: "desc" },
                  select,
                  take: 20,
              })
            : Promise.resolve([]),
        prisma.post.findMany({
            where: { ...base, userData: { userId: post.authorId } },
            orderBy: { createdAt: "desc" },
            select,
            take: 12,
        }),
        prisma.post.findMany({
            where: { ...base, createdAt: { gte: threeMonthsAgo } },
            orderBy: { likes: { _count: "desc" } },
            select,
            take: limit * 2,
        }),
    ]);

    const myTags = new Set(post.tags.map((t) => t.toLowerCase()));
    const scored = new Map<string, { score: number; row: (typeof popular)[number] }>();

    for (const row of [...byTags, ...byLocation, ...byAuthor, ...popular]) {
        if (scored.has(row.id) || row.content.length === 0) continue;

        const sharedTags = row.tags.filter((t) => myTags.has(t.toLowerCase())).length;
        const score =
            sharedTags * 10 +
            (post.location && row.location === post.location ? 6 : 0) +
            (row.userData.userId === post.authorId ? 4 : 0) +
            Math.min(Math.log2(1 + row._count.likes) * 2, 8) +
            Math.random() * 2;

        scored.set(row.id, { score, row });
    }

    return [...scored.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ row }) => ({
            id: row.id,
            type: "post",
            data: {
                id: row.id,
                content: row.content,
                createdAt: row.createdAt,
                _count: row._count,
            },
        }));
}
