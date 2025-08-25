"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SearchProjectSchema = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(50).default(10),
});

export async function searchProjects(
    input: z.infer<typeof SearchProjectSchema>
) {
    const { query, cursor, limit } = SearchProjectSchema.parse(input);

    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                {
                    skills: {
                        some: {
                            name: { contains: query, mode: "insensitive" },
                        },
                    },
                },
                { description: { contains: query, mode: "insensitive" } },
                {
                    userData: {
                        user: {
                            OR: [
                                {
                                    username: {
                                        contains: query,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    name: {
                                        contains: query,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    contributors: {
                        some: {
                            user: {
                                OR: [
                                    {
                                        username: {
                                            contains: query,
                                            mode: "insensitive",
                                        },
                                    },
                                    {
                                        name: {
                                            contains: query,
                                            mode: "insensitive",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ],
        },
        include: {
            userData: {
                select: {
                    id: true,
                    user: { select: { id: true, username: true, name: true } },
                },
            },
            contributors: {
                select: {
                    id: true,
                    user: { select: { id: true, username: true, name: true } },
                },
            },
            skills: { select: { id: true, name: true } },
        },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
    });

    const sortedProjects = projects.sort((a, b) => {
        const getPriority = (project: typeof a) => {
            if (project.name.toLowerCase().includes(query.toLowerCase()))
                return 1;
            if (
                project.skills.some((s) =>
                    s.name.toLowerCase().includes(query.toLowerCase())
                )
            )
                return 2;
            if (
                project.description?.toLowerCase().includes(query.toLowerCase())
            )
                return 3;
            if (
                project.userData?.user.username
                    ?.toLowerCase()
                    .includes(query.toLowerCase()) ||
                project.userData?.user.name
                    ?.toLowerCase()
                    .includes(query.toLowerCase())
            )
                return 4;
            if (
                project.contributors.some(
                    (c) =>
                        c.user.username
                            ?.toLowerCase()
                            .includes(query.toLowerCase()) ||
                        c.user.name?.toLowerCase().includes(query.toLowerCase())
                )
            )
                return 5;
            return 6;
        };

        const priorityDiff = getPriority(a) - getPriority(b);
        if (priorityDiff !== 0) return priorityDiff;

        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    const hasNextPage = sortedProjects.length > limit;
    const results = hasNextPage ? sortedProjects.slice(0, -1) : sortedProjects;

    return {
        projects: results,
        nextCursor: hasNextPage ? results[results.length - 1].id : null,
    };
}
