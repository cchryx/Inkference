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

    const experienceSelect = {
        id: true,
        title: true,
        organization: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        location: true,
        locationType: true,
        employmentType: true,
        createdAt: true,
        updatedAt: true,
    };

    const educationSelect = {
        id: true,
        degree: true,
        fieldOfStudy: true,
        school: true,
        activitiesAndSocieties: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
    };

    const meritSelect = {
        id: true,
        title: true,
        issuer: true,
        meritType: true,
        summary: true,
        issueDate: true,
        expiryDate: true,
        image: true,
        createdAt: true,
        updatedAt: true,
    };

    const gallerySelect = {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        photos: {
            select: {
                id: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            },
        },
    };

    const orderByDur: any = [
        { status: "asc" },
        { endDate: { sort: "desc", nulls: "last" } },
        { startDate: "desc" },
    ];

    async function fetchPostDetails(posts: any[]) {
        const detailedPosts = await Promise.all(
            posts.map(async (post) => {
                let details: any = null;

                switch (post.type) {
                    case "project":
                        details = await prisma.project.findUnique({
                            where: { id: post.dataId },
                            select: projectSelect,
                        });
                        break;
                    case "experience":
                        details = await prisma.experience.findUnique({
                            where: { id: post.dataId },
                            select: experienceSelect,
                        });
                        break;
                    case "education":
                        details = await prisma.education.findUnique({
                            where: { id: post.dataId },
                            select: educationSelect,
                        });
                        break;
                    case "merit":
                        details = await prisma.merit.findUnique({
                            where: { id: post.dataId },
                            select: meritSelect,
                        });
                        break;
                    default:
                        details = {
                            content: (post as any).content ?? null,
                            description: (post as any).description ?? null,
                            location: (post as any).location ?? null,
                            tags: (post as any).tags ?? [],
                            mentions: (post as any).mentions ?? [],
                            views: (post as any).views ?? [],
                            likes: (post as any).likes ?? [],
                            saves: (post as any).saves ?? [],
                            createdAt: post.createdAt,
                            updatedAt: post.updatedAt,
                        };
                        break;
                }

                return { ...post, data: details };
            })
        );

        return detailedPosts;
    }

    // Determine the target user ID
    let targetUserId = userId;
    if (!targetUserId) {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return { error: "Unauthorized." };
        targetUserId = session.user.id;
    }

    // Fetch main user data **without skills**
    let userData = await prisma.userData.findUnique({
        where: { userId: targetUserId },
        select: {
            id: true,
            userId: true,
            projects: { select: projectSelect, orderBy: orderByDur },
            projectsContributedTo: {
                select: projectSelect,
                orderBy: orderByDur,
            },
            projectsLiked: { select: projectSelect },
            projectsViewed: { select: projectSelect },
            projectsSaved: { select: projectSelect },
            experiences: { select: experienceSelect, orderBy: orderByDur },
            educations: {
                select: educationSelect,
                orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
            },
            merits: {
                select: meritSelect,
                orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
            },
            posts: {
                select: {
                    id: true,
                    type: true,
                    dataId: true,
                    createdAt: true,
                    updatedAt: true,
                    description: true,
                    content: true,
                    location: true,
                    tags: true,
                    mentions: true,
                    views: true,
                    likes: true,
                    saves: true,
                },
                orderBy: { updatedAt: "desc" },
            },
            galleries: {
                select: gallerySelect,
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!userData) {
        userData = await prisma.userData.create({
            data: { userId: targetUserId },
            select: {
                id: true,
                userId: true,
                projects: { select: projectSelect },
                projectsContributedTo: { select: projectSelect },
                projectsLiked: { select: projectSelect },
                projectsViewed: { select: projectSelect },
                projectsSaved: { select: projectSelect },
                experiences: { select: experienceSelect, orderBy: orderByDur },
                educations: {
                    select: educationSelect,
                    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
                },
                merits: {
                    select: meritSelect,
                    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
                },
                posts: {
                    select: {
                        id: true,
                        type: true,
                        dataId: true,
                        createdAt: true,
                        updatedAt: true,
                        description: true,
                        content: true,
                        location: true,
                        tags: true,
                        mentions: true,
                        views: true,
                        likes: true,
                        saves: true,
                    },
                    orderBy: { updatedAt: "desc" },
                },
                galleries: {
                    select: gallerySelect,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    // Fetch the skills **separately**
    const skills = await prisma.skill.findMany({
        where: { users: { some: { id: userData.id } } },
        select: {
            id: true,
            name: true,
            iconImage: true,
            createdAt: true,
            updatedAt: true,
            projects: {
                where: { userDataId: userData.id },
                select: { id: true, name: true },
            },
            experiences: {
                where: { userDataId: userData.id },
                select: { id: true, title: true },
            },
        },
    });

    // Attach skills to the userData object
    (userData as any).skills = skills;

    // Hydrate posts
    if (userData.posts?.length) {
        userData.posts = await fetchPostDetails(userData.posts);
    }

    return userData;
}
