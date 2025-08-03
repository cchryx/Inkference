"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../getUserData";

export async function createProjectAction(data: {
    name: string;
    summary: string;
    description: string;
    projectLinks: string[];
    iconImageUrl: string;
    bannerImageUrl: string;
    projectResources: string[];
    status: "IN_PROGRESS" | "COMPLETE";
    startDate: number;
    endDate?: number | null;
    skills: string[];
    contributorIds: string[];
}) {
    const userData = await getUserData();

    if (!userData || "error" in userData) {
        return { error: "Unauthorized or no user data found" };
    }

    const project = await prisma.project.create({
        data: {
            userDataId: userData.id,
            name: data.name,
            summary: data.summary,
            description: data.description,
            projectLinks: data.projectLinks,
            projectResources: data.projectResources,
            iconImage: data.iconImageUrl || null,
            bannerImage: data.bannerImageUrl || null,
            status: data.status === "IN_PROGRESS" ? "IN_PROGRESS" : "COMPLETE",
            startDate: new Date(data.startDate * 1000),
            endDate: data.endDate ? new Date(data.endDate * 1000) : null,
            skills: data.skills,
            contributors: {
                connect: data.contributorIds.map((id) => ({ id })),
            },
        },
    });

    return project;
}
