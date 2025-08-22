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

    const skillSelect = {
        id: true,
        name: true,
        iconImage: true,
        createdAt: true,
        updatedAt: true,
        projects: { select: { id: true, name: true } },
        experiences: { select: { id: true, title: true } },
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
                let details = null;
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
                        details = null;
                }
                return { ...post, data: details };
            })
        );
        return detailedPosts;
    }

    let userData;

    if (userId) {
        userData = await prisma.userData.findUnique({
            where: { userId },
            select: {
                id: true,
                userId: true,
                skills: { select: skillSelect, orderBy: { name: "asc" } },
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
                    },
                    orderBy: { updatedAt: "desc" },
                },
                galleries: {
                    select: gallerySelect,
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!userData) return { error: "User data not found." };
    } else {
        const session = await auth.api.getSession({ headers: await headers() });
        const sessionUserId = session?.user?.id;
        if (!sessionUserId) return { error: "Unauthorized." };

        userData = await prisma.userData.findUnique({
            where: { userId: sessionUserId },
            select: {
                id: true,
                userId: true,
                skills: { select: skillSelect, orderBy: { name: "asc" } },
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
                data: { userId: sessionUserId },
                select: {
                    id: true,
                    userId: true,
                    skills: { select: skillSelect },
                    projects: { select: projectSelect },
                    projectsContributedTo: { select: projectSelect },
                    projectsLiked: { select: projectSelect },
                    projectsViewed: { select: projectSelect },
                    projectsSaved: { select: projectSelect },
                    experiences: {
                        select: experienceSelect,
                        orderBy: orderByDur,
                    },
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
    }

    if (userData?.posts?.length) {
        userData.posts = await fetchPostDetails(userData.posts);
    }

    return userData;
}
