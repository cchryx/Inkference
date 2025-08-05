"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserData(userId?: string) {
    const projectSelect = {
        id: true,
        name: true,
        summary: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        likes: true,
        saves: true,
        views: true,
        iconImage: true,
        bannerImage: true,
        skills: true,
    };

    const orderByDur: any = [
        { endDate: { sort: "desc", nulls: "last" } },
        { startDate: "desc" },
    ];

    if (userId) {
        const userData = await prisma.userData.findUnique({
            where: { userId },
            select: {
                id: true,
                userId: true,
                projects: {
                    select: projectSelect,
                    orderBy: orderByDur,
                },
                projectsContributedTo: {
                    select: projectSelect,
                    orderBy: orderByDur,
                },
                projectsLiked: {
                    select: projectSelect,
                },
                projectsViewed: {
                    select: projectSelect,
                },
                projectsSaved: {
                    select: projectSelect,
                },
            },
        });
        if (!userData) return { error: "User data not found." };
        return userData;
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const sessionUserId = session?.user?.id;
    if (!sessionUserId) return { error: "Unauthorized." };

    let userData = await prisma.userData.findUnique({
        where: { userId: sessionUserId },
        select: {
            id: true,
            userId: true,
            projects: { select: projectSelect, orderBy: orderByDur },
            projectsContributedTo: {
                select: projectSelect,
            },
            projectsLiked: { select: projectSelect },
            projectsViewed: { select: projectSelect },
            projectsSaved: { select: projectSelect },
        },
    });

    if (!userData) {
        userData = await prisma.userData.create({
            data: { userId: sessionUserId },
            select: {
                id: true,
                userId: true,
                projects: { select: projectSelect },
                projectsContributedTo: {
                    select: projectSelect,
                },
                projectsLiked: { select: projectSelect },
                projectsViewed: { select: projectSelect },
                projectsSaved: { select: projectSelect },
            },
        });
    }

    return userData;
}
