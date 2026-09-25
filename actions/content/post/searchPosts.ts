"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentViewer, visiblePosts } from "@/lib/visibility";

const SearchPostSchema = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(50).default(15),
});

/**
 * Searches posts by caption, #tag, location and author. Newest first.
 */
export async function searchPosts(input: z.infer<typeof SearchPostSchema>) {
    const { query, cursor, limit } = SearchPostSchema.parse(input);
    const q = query.trim();
    const tag = q.replace(/^#/, "");
    const insensitive = { contains: q, mode: "insensitive" as const };

    const viewer = await getCurrentViewer();

    const posts = await prisma.post.findMany({
        where: {
            AND: [visiblePosts(viewer)],
            type: "post",
            OR: [
                { description: insensitive },
                { tags: { hasSome: [tag, tag.toLowerCase()] } },
                { location: insensitive },
                {
                    userData: {
                        user: { OR: [{ username: insensitive }, { name: insensitive }] },
                    },
                },
            ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            content: true,
            createdAt: true,
            _count: { select: { likes: true, saves: true, views: true } },
        },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
    });

    const hasNextPage = posts.length > limit;
    const results = hasNextPage ? posts.slice(0, -1) : posts;

    return {
        posts: results.map((p) => ({ id: p.id, type: "post", data: p })),
        nextCursor: hasNextPage ? results[results.length - 1].id : null,
    };
}
