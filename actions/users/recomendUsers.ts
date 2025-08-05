"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";

function formatUser(user: any, reason: string) {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        reason,
    };
}

export async function recommendUsers(limit = 12) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const currentUserId = session?.user?.id;
        if (!currentUserId) {
            return { error: "Unauthorized." };
        }

        let userData = await prisma.userData.findUnique({
            where: { userId: currentUserId },
        });
        if (!userData) {
            userData = await prisma.userData.create({
                data: { userId: currentUserId },
            });
        }

        let relationships = await prisma.relationships.findUnique({
            where: { userId: currentUserId },
            include: {
                following: { select: { userId: true } },
                friends: { select: { userId: true } },
            },
        });
        if (!relationships) {
            relationships = await prisma.relationships.create({
                data: { userId: currentUserId },
                include: {
                    following: { select: { userId: true } },
                    friends: { select: { userId: true } },
                },
            });
        }

        const excludedUserIds = new Set<string>();
        excludedUserIds.add(currentUserId);
        relationships.following.forEach((f) => excludedUserIds.add(f.userId));
        relationships.friends.forEach((f) => excludedUserIds.add(f.userId));

        const recommendations: any[] = [];

        for (const step of [
            recommendFriendsOfFriends,
            recommendProjectContributors,
            recommendPopularUsers,
            recommendActiveUsers,
            recommendNewUsers,
            recommendRandomUsers,
        ]) {
            if (recommendations.length >= limit) break;
            const results = await step(
                relationships,
                userData,
                excludedUserIds,
                limit - recommendations.length
            );
            for (const r of results) {
                recommendations.push(r);
                excludedUserIds.add(r.id);
                if (recommendations.length >= limit) break;
            }
        }

        return {
            error: null,
            recommendedUsers: recommendations,
        };
    } catch (error) {
        if (error instanceof APIError) {
            let message = error.message?.trim() || "An unknown error occurred";
            message = message
                .split(/(?<=[.!?])\s+/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
            if (!/[.!?]$/.test(message)) message += ".";
            return { error: message };
        }
        return { error: "Internal server error." };
    }
}

// Helper functions (in the same file):

async function recommendFriendsOfFriends(
    relationships: any,
    _userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (relationships.following.length === 0 || limit <= 0) return [];

    // Map userId => User object (id, username, name) to get names easily
    const followingUserIds = relationships.following.map((f: any) => f.userId);
    const followingUsers = await prisma.user.findMany({
        where: { id: { in: followingUserIds } },
        select: { id: true, username: true, name: true },
    });
    const userIdToName = new Map(followingUsers.map((u) => [u.id, u.name]));

    const followingRelationships = await prisma.relationships.findMany({
        where: {
            userId: {
                in: followingUserIds,
            },
        },
        include: {
            following: true,
        },
    });

    const fofUserIdToMutualFollowers = new Map<string, string[]>();

    for (const rel of followingRelationships) {
        for (const fof of rel.following) {
            if (!excludedUserIds.has(fof.userId)) {
                if (!fofUserIdToMutualFollowers.has(fof.userId)) {
                    fofUserIdToMutualFollowers.set(fof.userId, []);
                }
                fofUserIdToMutualFollowers.get(fof.userId)!.push(rel.userId);
            }
        }
    }

    if (fofUserIdToMutualFollowers.size === 0) return [];

    // Get all fof users details
    const fofUserIds = Array.from(fofUserIdToMutualFollowers.keys());
    const fofUsers = await prisma.user.findMany({
        where: { id: { in: fofUserIds } },
        take: limit,
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
        },
    });

    // Map each fof user to a reason mentioning mutual followers by name
    return fofUsers.map((user) => {
        const mutualFollowersIds =
            fofUserIdToMutualFollowers.get(user.id) || [];
        const mutualFollowersNames = mutualFollowersIds
            .map((id) => userIdToName.get(id))
            .filter(Boolean)
            .join(", ");

        return formatUser(user, `Followed by ${mutualFollowersNames}`);
    });
}

async function recommendProjectContributors(
    _relationships: any,
    userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (limit <= 0) return [];

    // Get the projects current user contributed to
    const contributedProjects = await prisma.project.findMany({
        where: {
            contributors: {
                some: { userId: userData.id },
            },
        },
        select: { id: true, name: true },
    });

    const projectIds = contributedProjects.map((p) => p.id);
    if (projectIds.length === 0) return [];

    // Get contributors for those projects (excluding current user)
    const contributorsUserData = await prisma.userData.findMany({
        where: {
            projectsContributedTo: {
                some: { id: { in: projectIds } },
            },
            id: {
                not: userData.id,
            },
        },
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                },
            },
            projectsContributedTo: {
                where: {
                    id: { in: projectIds },
                },
                select: {
                    name: true,
                },
            },
        },
        take: limit,
    });

    const results = [];
    for (const contributor of contributorsUserData) {
        if (excludedUserIds.has(contributor.user.id)) continue;

        // Get the first project name they share with current user
        const sharedProject = contributor.projectsContributedTo[0];
        const projectName = sharedProject ? sharedProject.name : "a project";

        results.push(
            formatUser(
                contributor.user,
                `Contributed to your project: ${projectName}`
            )
        );
        if (results.length >= limit) break;
    }

    return results;
}

async function recommendPopularUsers(
    _relationships: any,
    _userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (limit <= 0) return [];

    const popularRelationships = await prisma.relationships.findMany({
        where: {
            userId: { notIn: Array.from(excludedUserIds) },
        },
        orderBy: {
            followers: {
                _count: "desc",
            },
        },
        take: limit * 2, // Fetch more to filter out zero followers below
        select: {
            userId: true,
            followers: true, // fetch followers array to count length
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                },
            },
        },
    });

    // Filter out users with zero followers
    const filtered = popularRelationships.filter(
        (rel) => rel.followers.length > 0
    );

    // Return only up to limit
    const limited = filtered.slice(0, limit);

    return limited.map((rel) =>
        formatUser(rel.user, "Popular user with many followers")
    );
}

async function recommendActiveUsers(
    _relationships: any,
    _userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (limit <= 0) return [];

    const activeUsersData = await prisma.userData.findMany({
        where: {
            userId: { notIn: Array.from(excludedUserIds) },
        },
        orderBy: {
            projects: {
                _count: "desc",
            },
        },
        take: limit,
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                },
            },
        },
    });

    return activeUsersData.map((userDataEntry) =>
        formatUser(userDataEntry.user, "User with many projects")
    );
}

async function recommendNewUsers(
    _relationships: any,
    _userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (limit <= 0) return [];

    const newUsers = await prisma.user.findMany({
        where: {
            id: { notIn: Array.from(excludedUserIds) },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
        },
    });

    return newUsers.map((user) => formatUser(user, "Recently joined"));
}

async function recommendRandomUsers(
    _relationships: any,
    _userData: any,
    excludedUserIds: Set<string>,
    limit: number
) {
    if (limit <= 0) return [];

    const randomUsers = await prisma.user.findMany({
        where: {
            id: { notIn: Array.from(excludedUserIds) },
        },
        orderBy: {
            // Use approximate randomness: sort by createdAt with some offset (Prisma doesn't support full `RANDOM()` in many DBs)
            createdAt: "asc", // could use "desc" and add randomness client-side if needed
        },
        take: limit,
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
        },
    });

    return randomUsers.map((user) =>
        formatUser(user, "User you might be interested in")
    );
}
