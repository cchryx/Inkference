"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentViewer } from "@/lib/visibility";

const SearchUserSchema = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(50).default(10),
});

export async function searchUsers(input: z.infer<typeof SearchUserSchema>) {
    const { query, cursor, limit } = SearchUserSchema.parse(input);
    const viewer = await getCurrentViewer();

    const users = await prisma.user.findMany({
        where: {
            // Only users who finished setting up (have a username).
            username: { not: null },
            // Hide people you've blocked or who blocked you.
            ...(viewer.blocked.length ? { id: { notIn: viewer.blocked } } : {}),
            OR: [
                { name: { contains: query.trim(), mode: "insensitive" } },
                { username: { contains: query.trim(), mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
        },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
            name: "asc",
        },
    });

    const hasNextPage = users.length > limit;
    const results = hasNextPage ? users.slice(0, -1) : users;

    return {
        users: results,
        nextCursor: hasNextPage ? results[results.length - 1].id : null,
    };
}
