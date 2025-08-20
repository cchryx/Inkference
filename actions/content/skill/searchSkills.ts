"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SearchSkillSchema = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(50).default(10),
});

export async function searchSkills(input: z.infer<typeof SearchSkillSchema>) {
    const { query, cursor, limit } = SearchSkillSchema.parse(input);

    const skills = await prisma.skill.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        select: { id: true, name: true, iconImage: true },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
    });

    const hasNextPage = skills.length > limit;
    const results = hasNextPage ? skills.slice(0, -1) : skills;

    return {
        skills: results,
        nextCursor: hasNextPage ? results[results.length - 1].id : null,
    };
}
