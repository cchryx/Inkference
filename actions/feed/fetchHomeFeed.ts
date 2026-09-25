"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Prisma } from "@/app/generated/prisma/client";
import { recordEngagement } from "@/lib/engagement";
import { notifyViewMilestones } from "@/lib/notify";
import { getViewerContext, visiblePosts, visibleProjects, type ViewerContext } from "@/lib/visibility";

/*
 * Home feed
 *
 * Every tab works in two phases:
 *   1. "unseen": posts you haven't seen yet, newest first.
 *   2. "seen":   once those run out, a "caught up" marker is sent, then
 *                older posts you've already seen, so scrolling never dead-ends.
 *
 * Pagination uses a keyset cursor (createdAt + id) instead of skip/offset,
 * so page 1000 is as fast as page 1. A post counts as seen once the
 * browser reports it via markPostsSeen().
 */

export type FeedType = "foryou" | "following" | "friends";

type Phase = "unseen" | "seen";
// p = phase, t/id = last post sent, m = show "caught up" before the first seen post
type Cursor = { p: Phase; t?: string; id?: string; m?: boolean };

const MAX_LIMIT = 30;

function encodeCursor(c: Cursor) {
    return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(raw?: string): Cursor {
    if (!raw) return { p: "unseen" };
    try {
        const c = JSON.parse(Buffer.from(raw, "base64url").toString());
        if (c.p === "unseen" || c.p === "seen") return c;
    } catch {}
    return { p: "unseen" };
}

// "Older than the last post I sent": (createdAt, id) < (t, id)
function olderThan(t: string, id: string): Prisma.PostWhereInput {
    const date = new Date(t);
    return {
        OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }],
    };
}

const userSelect = {
    select: {
        user: {
            select: { id: true, name: true, username: true, image: true },
        },
    },
} as const;

// Only the numbers and "did I like/save it" are loaded, never the full
// list of every user who liked a post.
function postSelect(myUserDataId: string) {
    return {
        id: true,
        dataId: true,
        type: true,
        description: true,
        content: true,
        location: true,
        tags: true,
        mentions: true,
        createdAt: true,
        updatedAt: true,
        userData: userSelect,
        _count: { select: { likes: true, saves: true, views: true, comments: true } },
        likes: { where: { id: myUserDataId }, select: { id: true } },
        saves: { where: { id: myUserDataId }, select: { id: true } },
    } satisfies Prisma.PostSelect;
}

function findPosts(where: Prisma.PostWhereInput, take: number, myUserDataId: string) {
    return prisma.post.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take,
        select: postSelect(myUserDataId),
    });
}

type PostRow = Awaited<ReturnType<typeof findPosts>>[number];

// Loads the linked projects for a whole page in ONE query (no N+1).
async function loadProjects(posts: PostRow[], myUserDataId: string, viewer: ViewerContext) {
    const ids = posts.filter((p) => p.type === "project").map((p) => p.dataId);
    if (ids.length === 0) return new Map();

    const projects = await prisma.project.findMany({
        where: { AND: [{ id: { in: ids } }, visibleProjects(viewer)] },
        include: {
            userData: userSelect,
            skills: { select: { id: true, name: true, iconImage: true } },
            _count: { select: { likes: true, saves: true, views: true } },
            likes: { where: { id: myUserDataId }, select: { id: true } },
            saves: { where: { id: myUserDataId }, select: { id: true } },
        },
    });

    return new Map(projects.map((p) => [p.id, p]));
}

// Which posts belong in this tab (before the seen/unseen split).
async function baseFilter(
    feedType: FeedType,
    currentUserId: string
): Promise<Prisma.PostWhereInput | null> {
    if (feedType === "foryou") return {};

    const relation =
        feedType === "following"
            ? { followers: { some: { userId: currentUserId } } }
            : { friendOf: { some: { userId: currentUserId } } };

    const authors = await prisma.userData.findMany({
        where: { user: { Relationships: relation } },
        select: { id: true },
    });
    if (authors.length === 0) return null;

    return { userDataId: { in: authors.map((a) => a.id) } };
}

async function getMyUserDataId(userId: string, firstPage: boolean) {
    if (firstPage) {
        // Make sure the rows exist (only needed once, on the first page).
        const [userData] = await Promise.all([
            prisma.userData.upsert({
                where: { userId },
                update: {},
                create: { userId },
                select: { id: true },
            }),
            prisma.relationships.upsert({
                where: { userId },
                update: {},
                create: { userId },
                select: { id: true },
            }),
        ]);
        return userData.id;
    }

    const userData = await prisma.userData.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!userData) throw new Error("User data not found.");
    return userData.id;
}

export async function fetchHomeFeed({
    cursor,
    limit = 10,
    feedType = "foryou",
}: {
    cursor?: string;
    limit?: number;
    feedType?: FeedType;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;
    if (!currentUserId) throw new Error("Unauthorized.");

    limit = Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
    const pos = decodeCursor(cursor);

    const [myUserDataId, base, viewer] = await Promise.all([
        getMyUserDataId(currentUserId, !cursor),
        baseFilter(feedType, currentUserId),
        getViewerContext(currentUserId),
    ]);

    if (!base) return { items: [], nextCursor: undefined };

    const page: { row: PostRow; phase: Phase }[] = [];
    let nextCursor: Cursor | undefined;
    let caughtUpAt = -1;

    // Phase 1: unseen posts
    if (pos.p === "unseen") {
        const rows = await findPosts(
            {
                AND: [
                    base,
                    visiblePosts(viewer), // privacy: only what this person may see
                    { views: { none: { id: myUserDataId } } },
                    pos.t && pos.id ? olderThan(pos.t, pos.id) : {},
                ],
            },
            limit + 1,
            myUserDataId
        );

        const hasMore = rows.length > limit;
        for (const row of rows.slice(0, limit)) page.push({ row, phase: "unseen" });

        if (hasMore) {
            const last = page[page.length - 1].row;
            nextCursor = { p: "unseen", t: last.createdAt.toISOString(), id: last.id };
        } else {
            // Out of unseen posts: switch to seen posts, starting from the newest.
            pos.p = "seen";
            pos.t = undefined;
            pos.id = undefined;
            caughtUpAt = page.length;
        }
    }

    // Phase 2: already-seen posts (fills the rest of this page)
    const remaining = limit - page.length;
    if (pos.p === "seen" && remaining > 0) {
        const rows = await findPosts(
            {
                AND: [
                    base,
                    visiblePosts(viewer), // privacy: only what this person may see
                    { views: { some: { id: myUserDataId } } },
                    pos.t && pos.id ? olderThan(pos.t, pos.id) : {},
                ],
            },
            remaining + 1,
            myUserDataId
        );

        const hasMore = rows.length > remaining;
        for (const row of rows.slice(0, remaining)) page.push({ row, phase: "seen" });

        const last = page[page.length - 1]?.row;
        nextCursor =
            hasMore && last
                ? { p: "seen", t: last.createdAt.toISOString(), id: last.id }
                : undefined;

        // Marker carried over from the previous page.
        if (pos.m) caughtUpAt = 0;
        // Only show "caught up" if there are seen posts after it.
        if (rows.length === 0) caughtUpAt = -1;
    } else if (pos.p === "seen" && remaining === 0 && caughtUpAt !== -1) {
        // Page filled exactly with the last unseen posts; seen ones (and the
        // "caught up" marker) start on the next page.
        nextCursor = { p: "seen", m: true };
        caughtUpAt = -1;
    }

    const projects = await loadProjects(
        page.map((p) => p.row),
        myUserDataId,
        viewer
    );

    const items = [];
    for (let i = 0; i < page.length; i++) {
        if (i === caughtUpAt) items.push({ type: "caught_up" as const });

        const { likes, saves, _count, ...post } = page[i].row;
        const project = post.type === "project" ? projects.get(post.dataId) : null;
        if (post.type === "project" && !project) continue; // project was deleted

        const source = project ?? { likes, saves, _count };

        items.push({
            type: post.type,
            content: {
                ...post,
                author: post.userData?.user,
                data: project ?? null,
                seen: page[i].phase === "seen",
                stats: {
                    likes: source._count.likes,
                    saves: source._count.saves,
                    views: source._count.views,
                    // Comments always belong to the post itself.
                    comments: _count.comments,
                    liked: source.likes.length > 0,
                    saved: source.saves.length > 0,
                },
            },
        });
    }

    return {
        items,
        nextCursor: nextCursor ? encodeCursor(nextCursor) : undefined,
    };
}

export type FeedPage = Awaited<ReturnType<typeof fetchHomeFeed>>;
export type FeedItem = FeedPage["items"][number];

/**
 * Called by the browser (batched) when posts have been on screen.
 */
export async function markPostsSeen(postIds: string[]) {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const ids = [...new Set(postIds)]
        .filter((id) => typeof id === "string")
        .slice(0, 50);
    if (ids.length === 0) return;

    try {
        const userData = await prisma.userData.findUnique({
            where: { userId: currentUserId },
            select: { id: true },
        });
        if (!userData) return;

        // Posts that still exist, and whether I've viewed them before.
        const posts = await prisma.post.findMany({
            where: { id: { in: ids } },
            select: { id: true, views: { where: { id: userData.id }, select: { id: true } } },
        });
        if (posts.length === 0) return;

        // Count today's view for Trending (once per person per day).
        await recordEngagement("view", "post", posts.map((p) => p.id), userData.id);

        // Mark as seen (only the ones not already marked).
        const fresh = posts.filter((p) => p.views.length === 0).map((p) => ({ id: p.id }));
        if (fresh.length === 0) return;

        await prisma.userData.update({
            where: { id: userData.id },
            data: { postsViewed: { connect: fresh } },
        });

        // "Your post reached 100 views" style notifications.
        await notifyViewMilestones("post", fresh.map((p) => p.id));
    } catch (error) {
        console.error("Failed to mark posts as seen:", error);
    }
}
