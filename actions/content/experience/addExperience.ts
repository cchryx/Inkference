"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";

export async function addExperience(data: {
    title: string;
    organization: string;
    description: string;
    location: string;
    locationType: string;
    employmentType: string;
    status: "Ongoing" | "Complete";
    startDate: number;
    endDate?: number | null;
}) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    const experience = await prisma.experience.create({
        data: {
            userDataId: userData.id,
            title: data.title,
            organization: data.organization,
            description: data.description,
            location: data.location,
            locationType: data.locationType,
            employmentType: data.employmentType,
            status: data.status,
            startDate: new Date(data.startDate * 1000),
            endDate: data.endDate ? new Date(data.endDate * 1000) : null,
        },
    });

    return experience;
}
