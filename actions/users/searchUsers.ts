"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SearchUserSchema = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(50).default(10),
});

export async function searchUsers(input: z.infer<typeof SearchUserSchema>) {
    const { query, cursor, limit } = SearchUserSchema.parse(input);

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
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
