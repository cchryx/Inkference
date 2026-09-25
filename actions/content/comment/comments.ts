"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { recordEngagement } from "@/lib/engagement";
import { notify } from "@/lib/notify";
import { canViewPost, getViewerContext } from "@/lib/visibility";

const MAX_LENGTH = 1000;
const PAGE_SIZE = 20;

const commentSelect = {
    id: true,
    text: true,
    createdAt: true,
    userData: {
        select: {
            userId: true,
            user: { select: { name: true, username: true, image: true } },
        },
    },
    post: { select: { userData: { select: { userId: true } } } },
} as const;

type Row = {
    id: string;
    text: string;
    createdAt: Date;
    userData: { userId: string; user: { name: string; username: string | null; image: string | null } };
    post: { userData: { userId: string } };
};

// You can delete your own comments, and any comment on your own post.
function toComment(row: Row, viewerId: string | null) {
    return {
        id: row.id,
        text: row.text,
        createdAt: row.createdAt.toISOString(),
        author: row.userData.user,
        canDelete:
            !!viewerId && (row.userData.userId === viewerId || row.post.userData.userId === viewerId),
    };
}

export type CommentItem = ReturnType<typeof toComment>;

async function getViewerId() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

/** Newest comments first, 20 at a time. */
export async function getComments(postId: string, cursor?: string) {
    const viewerId = await getViewerId();
    const viewer = await getViewerContext(viewerId);
    if (!(await canViewPost(postId, viewer))) return { comments: [], nextCursor: undefined };

    const rows = await prisma.comment.findMany({
        // Comments from people you blocked (or who blocked you) are hidden.
        where: { postId, ...(viewer.blocked.length ? { userData: { userId: { notIn: viewer.blocked } } } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: commentSelect,
        take: PAGE_SIZE + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
        comments: page.map((r) => toComment(r, viewerId)),
        nextCursor: hasMore ? page[page.length - 1].id : undefined,
    };
}

export async function addComment(postId: string, text: string) {
    const viewerId = await getViewerId();
    if (!viewerId) return { error: "Sign in to comment.", comment: null };

    const clean = text.trim().replace(/\n{3,}/g, "\n\n");
    if (!clean) return { error: "Write something first.", comment: null };
    if (clean.length > MAX_LENGTH) {
        return { error: `Comments can be up to ${MAX_LENGTH} characters.`, comment: null };
    }

    try {
        const [post, userData] = await Promise.all([
            prisma.post.findUnique({
                where: { id: postId },
                select: { id: true, userData: { select: { userId: true } } },
            }),
            prisma.userData.upsert({
                where: { userId: viewerId },
                update: {},
                create: { userId: viewerId },
                select: { id: true },
            }),
        ]);
        if (!post || !(await canViewPost(postId, await getViewerContext(viewerId)))) {
            return { error: "This post no longer exists.", comment: null };
        }

        const row = await prisma.comment.create({
            data: { text: clean, postId, userDataId: userData.id },
            select: commentSelect,
        });

        // Comments count towards Trending, and tell the post owner (grouped).
        await Promise.all([
            recordEngagement("comment", "post", [postId], userData.id),
            notify({
                recipientId: post.userData.userId,
                actorId: viewerId,
                type: "comment",
                targetType: "post",
                targetId: postId,
                preview: clean,
            }),
        ]);

        return { error: null, comment: toComment(row, viewerId) };
    } catch (err) {
        console.error("addComment failed:", err);
        return { error: "Couldn't post your comment. Please try again.", comment: null };
    }
}

export async function deleteComment(commentId: string) {
    const viewerId = await getViewerId();
    if (!viewerId) return { error: "Sign in first." };

    const row = await prisma.comment.findUnique({ where: { id: commentId }, select: commentSelect });
    if (!row) return { error: null }; // already gone

    if (!toComment(row, viewerId).canDelete) {
        return { error: "You can't delete this comment." };
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return { error: null };
}
