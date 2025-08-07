"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../getUserData";

export async function addEducation(data: {
    degree: string;
    fieldOfStudy: string;
    school: string;
    activitiesAndSocieties: string;
    startDate: number;
    endDate: number;
}) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    const education = await prisma.education.create({
        data: {
            userDataId: userData.id,
            degree: data.degree,
            fieldOfStudy: data.fieldOfStudy,
            school: data.school,
            activitiesAndSocieties: data.activitiesAndSocieties,
            startDate: new Date(data.startDate * 1000),
            endDate: new Date(data.endDate * 1000),
        },
    });

    return education;
}
