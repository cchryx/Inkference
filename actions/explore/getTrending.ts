"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { PUBLIC_VIEWER, visiblePosts, visibleProjects } from "@/lib/visibility";

/*
 * Trending posts and projects
 *
 * Every like, view and save is logged with a timestamp (see lib/engagement).
 * For the chosen window (last 24 hours or last 7 days):
 *
 *   score = views x1 + likes x4 + comments x5 + saves x6
 *
 * Saves and likes count more than views because they take more effort.
 * Newer items get a small boost so the list keeps moving. If there isn't
 * enough activity yet, the all-time most liked items fill the gaps.
 *
 * Only public items are shown (the list is shared by everyone).
 * The result is cached for 5 minutes, so the page is fast and the
 * database isn't hit on every visit.
 */

export type TrendingWindow = "day" | "week";
export type TrendingKind = "all" | "post" | "project";

const WEIGHTS: Record<string, number> = { view: 1, like: 4, comment: 5, save: 6 };
const LIMIT = 24;

const authorSelect = {
    select: { user: { select: { name: true, username: true, image: true } } },
} as const;
const counts = { select: { likes: true, saves: true, views: true } } as const;

type Recent = { views: number; likes: number; saves: number };

async function computeTrending(window: TrendingWindow, kind: TrendingKind) {
    const hours = window === "day" ? 24 : 24 * 7;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await prisma.engagement.groupBy({
        by: ["targetType", "targetId", "kind"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
    });

    const scores = new Map<string, { type: string; id: string; score: number; recent: Recent }>();
    for (const r of rows) {
        const key = `${r.targetType}:${r.targetId}`;
        const entry =
            scores.get(key) ??
            { type: r.targetType, id: r.targetId, score: 0, recent: { views: 0, likes: 0, saves: 0 } };
        const n = r._count._all;
        entry.score += (WEIGHTS[r.kind] ?? 0) * n;
        if (r.kind === "view") entry.recent.views += n;
        if (r.kind === "like") entry.recent.likes += n;
        if (r.kind === "save") entry.recent.saves += n;
        scores.set(key, entry);
    }

    const top = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, LIMIT * 2);
    const postIds = top.filter((t) => t.type === "post").map((t) => t.id);
    const projectIds = top.filter((t) => t.type === "project").map((t) => t.id);

    // Fallback: all-time most liked, if there isn't much recent activity.
    const needFill = top.length < LIMIT;

    const [posts, projects, popularPosts, popularProjects] = await Promise.all([
        postIds.length
            ? prisma.post.findMany({
                  where: { AND: [{ id: { in: postIds }, type: "post" }, visiblePosts(PUBLIC_VIEWER)] },
                  select: { id: true, content: true, createdAt: true, userData: authorSelect, _count: counts },
              })
            : [],
        projectIds.length
            ? prisma.project.findMany({
                  where: { AND: [{ id: { in: projectIds } }, visibleProjects(PUBLIC_VIEWER)] },
                  select: { id: true, name: true, bannerImage: true, iconImage: true, createdAt: true, userData: authorSelect, _count: counts },
              })
            : [],
        needFill
            ? prisma.post.findMany({
                  where: { AND: [{ type: "post", id: { notIn: postIds } }, visiblePosts(PUBLIC_VIEWER)] },
                  orderBy: { likes: { _count: "desc" } },
                  select: { id: true, content: true, createdAt: true, userData: authorSelect, _count: counts },
                  take: LIMIT,
              })
            : [],
        needFill
            ? prisma.project.findMany({
                  where: { AND: [{ id: { notIn: projectIds } }, visibleProjects(PUBLIC_VIEWER)] },
                  orderBy: { likes: { _count: "desc" } },
                  select: { id: true, name: true, bannerImage: true, iconImage: true, createdAt: true, userData: authorSelect, _count: counts },
                  take: LIMIT,
              })
            : [],
    ]);

    const empty: Recent = { views: 0, likes: 0, saves: 0 };
    const ageBoost = (createdAt: Date) => {
        const days = (Date.now() - createdAt.getTime()) / 86_400_000;
        return 1 / Math.pow(days / 7 + 1, 0.3); // gentle: newer ranks a bit higher
    };

    const items = [
        ...posts.map((p) => {
            const s = scores.get(`post:${p.id}`)!;
            return {
                kind: "post" as const,
                id: p.id,
                title: `@${p.userData.user.username}`,
                image: p.content[0] ?? null,
                createdAt: p.createdAt,
                author: p.userData.user,
                counts: p._count,
                recent: s.recent,
                score: s.score * ageBoost(p.createdAt),
            };
        }),
        ...projects.map((p) => {
            const s = scores.get(`project:${p.id}`)!;
            return {
                kind: "project" as const,
                id: p.id,
                title: p.name,
                image: p.bannerImage ?? p.iconImage ?? null,
                createdAt: p.createdAt,
                author: p.userData.user,
                counts: p._count,
                recent: s.recent,
                score: s.score * ageBoost(p.createdAt),
            };
        }),
        // Fillers always rank below real trending items.
        ...popularPosts
            .filter((p) => p.content.length > 0)
            .map((p) => ({
                kind: "post" as const,
                id: p.id,
                title: `@${p.userData.user.username}`,
                image: p.content[0] ?? null,
                createdAt: p.createdAt,
                author: p.userData.user,
                counts: p._count,
                recent: empty,
                score: -1 / (1 + p._count.likes * 4 + p._count.views),
            })),
        ...popularProjects.map((p) => ({
            kind: "project" as const,
            id: p.id,
            title: p.name,
            image: p.bannerImage ?? p.iconImage ?? null,
            createdAt: p.createdAt,
            author: p.userData.user,
            counts: p._count,
            recent: empty,
            score: -1 / (1 + p._count.likes * 4 + p._count.views),
        })),
    ];

    return items
        .filter((i) => kind === "all" || i.kind === kind)
        .sort((a, b) => b.score - a.score)
        .slice(0, LIMIT);
}

export async function getTrending(window: TrendingWindow = "day", kind: TrendingKind = "all") {
    const safeWindow: TrendingWindow = window === "week" ? "week" : "day";
    const safeKind: TrendingKind = kind === "post" || kind === "project" ? kind : "all";
    return unstable_cache(() => computeTrending(safeWindow, safeKind), ["trending", safeWindow, safeKind], {
        revalidate: 300,
    })();
}

export type TrendingItem = Awaited<ReturnType<typeof getTrending>>[number];
