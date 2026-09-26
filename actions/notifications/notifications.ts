"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getViewerContext, visiblePosts, visibleProjects } from "@/lib/visibility";

const PAGE_SIZE = 20;

async function currentUserId() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

/** Your notifications, newest activity first, 20 at a time. */
export async function getNotifications(cursor?: string) {
    const userId = await currentUserId();
    if (!userId) return { items: [], nextCursor: undefined };

    const rows = await prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    // Load all people, posts and projects for this page in 3 queries.
    const actorIds = [...new Set(page.flatMap((n) => n.actorIds))];
    const postIds = page.filter((n) => n.targetType === "post" && n.targetId).map((n) => n.targetId!);
    const projectIds = page.filter((n) => n.targetType === "project" && n.targetId).map((n) => n.targetId!);

    // Only link to posts/projects you're still allowed to see.
    const viewer = await getViewerContext(userId);

    const [users, posts, projects] = await Promise.all([
        actorIds.length
            ? prisma.user.findMany({
                  where: { id: { in: actorIds } },
                  select: { id: true, name: true, username: true, image: true },
              })
            : [],
        postIds.length
            ? prisma.post.findMany({
                  where: { AND: [{ id: { in: postIds } }, visiblePosts(viewer)] },
                  select: { id: true, type: true, dataId: true, content: true },
              })
            : [],
        projectIds.length
            ? prisma.project.findMany({
                  where: { AND: [{ id: { in: projectIds } }, visibleProjects(viewer)] },
                  select: { id: true, name: true, iconImage: true, bannerImage: true },
              })
            : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const items = page.flatMap((n) => {
        const actors = n.actorIds.map((id) => userMap.get(id)).filter((u) => !!u);

        let target: { kind: "post" | "project"; title: string | null; image: string | null } | null = null;
        let href = "/inbox";

        if (n.targetType === "post" && n.targetId) {
            const post = postMap.get(n.targetId);
            if (!post) return []; // post was deleted
            target = { kind: "post", title: null, image: post.content[0] ?? null };
            href = post.type === "project" ? `/project/${post.dataId}` : `/post/${post.id}`;
        } else if (n.targetType === "project" && n.targetId) {
            const project = projectMap.get(n.targetId);
            if (!project) return []; // project was deleted
            target = { kind: "project", title: project.name, image: project.iconImage ?? project.bannerImage };
            href = `/project/${project.id}`;
        } else if (n.type === "friend_request") {
            href = "/inbox?tab=requests";
        } else if (n.type === "tip") {
            href = "/settings?section=payments";
        } else if (actors[0]?.username) {
            href = `/profile/${actors[0].username}`;
        }

        // Skip people-only notifications whose people no longer exist.
        if (n.type !== "views" && actors.length === 0) return [];

        return [
            {
                id: n.id,
                type: n.type,
                read: n.read,
                updatedAt: n.updatedAt.toISOString(),
                actors,
                actorCount: n.actorCount,
                preview: n.preview,
                target,
                href,
            },
        ];
    });

    return { items, nextCursor: hasMore ? page[page.length - 1].id : undefined };
}

export type NotificationItem = Awaited<ReturnType<typeof getNotifications>>["items"][number];

/** Number for the red badge. */
export async function getUnreadCount() {
    const userId = await currentUserId();
    if (!userId) return 0;
    return prisma.notification.count({ where: { recipientId: userId, read: false } });
}

export async function markAllNotificationsRead() {
    const userId = await currentUserId();
    if (!userId) return;
    await prisma.notification.updateMany({
        where: { recipientId: userId, read: false },
        data: { read: true },
    });
}
