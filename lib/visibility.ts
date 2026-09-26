import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/session";

/*
 * Who can see a post, project or gallery?
 *
 *  1. The owner always can.
 *  2. Nobody who is blocked (either direction), on the owner's
 *     "hidden from" list in Settings, or on the item's own hidden list.
 *  3. Otherwise it depends on the audience:
 *       item audience (or the owner's default from Settings if DEFAULT)
 *       PUBLIC    everyone
 *       FOLLOWERS people who follow the owner, and friends
 *       FRIENDS   friends only
 *       CUSTOM    only the people picked for that item
 *       PRIVATE   only the owner
 *
 * The rules are turned into a database filter, so hidden items are never
 * even loaded.
 */

export const AUDIENCES = ["PUBLIC", "FOLLOWERS", "FRIENDS", "PRIVATE"] as const;
export type Audience = (typeof AUDIENCES)[number];
export const VISIBILITIES = ["DEFAULT", "PUBLIC", "FOLLOWERS", "FRIENDS", "CUSTOM", "PRIVATE"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type ViewerContext = {
    viewerId: string | null;
    following: string[]; // people the viewer follows
    friends: string[];
    blocked: string[]; // blocked either way
    blockedByMe: string[]; // only the ones the viewer blocked
};

const ANON: ViewerContext = { viewerId: null, following: [], friends: [], blocked: [], blockedByMe: [] };

export async function getViewerContext(viewerId: string | null | undefined): Promise<ViewerContext> {
    if (!viewerId) return ANON;

    const rel = await prisma.relationships.findUnique({
        where: { userId: viewerId },
        select: {
            following: { select: { userId: true } },
            friends: { select: { userId: true } },
            blockedUsers: { select: { userId: true } },
            blockedBy: { select: { userId: true } },
        },
    });

    return {
        viewerId,
        following: rel?.following.map((r) => r.userId) ?? [],
        friends: rel?.friends.map((r) => r.userId) ?? [],
        blocked: [
            ...(rel?.blockedUsers.map((r) => r.userId) ?? []),
            ...(rel?.blockedBy.map((r) => r.userId) ?? []),
        ],
        blockedByMe: rel?.blockedUsers.map((r) => r.userId) ?? [],
    };
}

/** The signed-in viewer (loaded once per request). */
export const getCurrentViewer = cache(async () => {
    const session = await getSession();
    return getViewerContext(session?.user?.id);
});

// "Audience is X": set on the item, or DEFAULT + the owner's default is X.
function audienceIs(level: Audience) {
    const conditions: object[] = [
        { visibility: level },
        { visibility: "DEFAULT", userData: { user: { PrivacySettings: { is: { defaultVisibility: level } } } } },
    ];
    // No settings saved yet = everything public.
    if (level === "PUBLIC") {
        conditions.push({ visibility: "DEFAULT", userData: { user: { PrivacySettings: { is: null } } } });
    }
    return { OR: conditions };
}

// Anything an admin flagged is hidden from everyone while it's reviewed.
const NOT_FLAGGED = { hiddenAt: null };

// Shared by posts, projects and galleries (same field names on each).
function contentWhere(ctx: ViewerContext) {
    return { AND: [audienceWhere(ctx), NOT_FLAGGED] };
}

function audienceWhere(ctx: ViewerContext) {
    const { viewerId, following, friends, blocked } = ctx;

    const allowed: object[] = [audienceIs("PUBLIC")];
    if (viewerId) {
        const followersOrFriends = [...new Set([...following, ...friends])];
        if (followersOrFriends.length) {
            allowed.push({ AND: [audienceIs("FOLLOWERS"), { userData: { userId: { in: followersOrFriends } } }] });
        }
        if (friends.length) {
            allowed.push({ AND: [audienceIs("FRIENDS"), { userData: { userId: { in: friends } } }] });
        }
        allowed.push({ visibility: "CUSTOM", allowedUserIds: { has: viewerId } });
    }

    if (!viewerId) return { OR: allowed };

    return {
        OR: [
            { userData: { userId: viewerId } }, // your own stuff
            {
                AND: [
                    { OR: allowed },
                    ...(blocked.length ? [{ userData: { userId: { notIn: blocked } } }] : []),
                    // Not on this item's "hide from" list. (Rows created before
                    // privacy existed have an empty/NULL list, which must count
                    // as "hidden from nobody".)
                    {
                        OR: [
                            { hiddenFromUserIds: { equals: null } },
                            { hiddenFromUserIds: { isEmpty: true } },
                            { NOT: { hiddenFromUserIds: { has: viewerId } } },
                        ],
                    },
                    { NOT: { userData: { user: { PrivacySettings: { is: { hiddenFrom: { has: viewerId } } } } } } },
                ],
            },
        ],
    };
}

export const visiblePosts = (ctx: ViewerContext) => contentWhere(ctx) as Prisma.PostWhereInput;
// Contributors can always see the projects they worked on.
export const visibleProjects = (ctx: ViewerContext) =>
    (ctx.viewerId
        ? { AND: [{ OR: [contentWhere(ctx), { contributors: { some: { userId: ctx.viewerId } } }] }, NOT_FLAGGED] }
        : contentWhere(ctx)) as Prisma.ProjectWhereInput;
export const visibleGalleries = (ctx: ViewerContext) => contentWhere(ctx) as Prisma.GalleryWhereInput;

/** Anonymous viewer: only public items (used for cached, shared lists like Trending). */
export const PUBLIC_VIEWER = ANON;

export async function canViewPost(postId: string, ctx: ViewerContext) {
    return (await prisma.post.count({ where: { AND: [{ id: postId }, visiblePosts(ctx)] } })) > 0;
}
export async function canViewProject(projectId: string, ctx: ViewerContext) {
    return (await prisma.project.count({ where: { AND: [{ id: projectId }, visibleProjects(ctx)] } })) > 0;
}
export async function canViewGallery(galleryId: string, ctx: ViewerContext) {
    return (await prisma.gallery.count({ where: { AND: [{ id: galleryId }, visibleGalleries(ctx)] } })) > 0;
}

/** Is there a block between these two people (either way)? */
export async function isBlockedBetween(a: string, b: string) {
    const count = await prisma.relationships.count({
        where: {
            OR: [
                { userId: a, blockedUsers: { some: { userId: b } } },
                { userId: b, blockedUsers: { some: { userId: a } } },
            ],
        },
    });
    return count > 0;
}
