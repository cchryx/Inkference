import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { PUBLIC_VIEWER, visibleGalleries, visiblePosts, visibleProjects } from "@/lib/visibility";

// Rebuilt at most once an hour, so Google asking for it doesn't hit the database.
export const revalidate = 3600;

// Google's limit is 50,000 links per sitemap.
const MAX_PER_TYPE = 10_000;

/**
 * Every PUBLIC page Google should know about. Private, friends-only and
 * hidden content is never listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [users, projects, posts, galleries] = await Promise.all([
        prisma.user.findMany({
            where: { username: { not: null } },
            select: { username: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: MAX_PER_TYPE,
        }),
        prisma.project.findMany({
            where: visibleProjects(PUBLIC_VIEWER),
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: MAX_PER_TYPE,
        }),
        prisma.post.findMany({
            where: { AND: [{ type: "post" }, visiblePosts(PUBLIC_VIEWER)] },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: MAX_PER_TYPE,
        }),
        prisma.gallery.findMany({
            where: visibleGalleries(PUBLIC_VIEWER),
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: MAX_PER_TYPE,
        }),
    ]);

    return [
        { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        ...users.map((u) => ({
            url: `${SITE_URL}/profile/${encodeURIComponent(u.username!)}`,
            lastModified: u.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
        ...projects.map((p) => ({
            url: `${SITE_URL}/project/${p.id}`,
            lastModified: p.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        })),
        ...posts.map((p) => ({
            url: `${SITE_URL}/post/${p.id}`,
            lastModified: p.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        })),
        ...galleries.map((g) => ({
            url: `${SITE_URL}/gallery/${g.id}`,
            lastModified: g.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.4,
        })),
    ];
}
