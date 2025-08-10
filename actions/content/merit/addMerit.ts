"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../getUserData";

export async function addMerit(data: {
    title: string;
    issuer: string;
    meritType: string;
    summary: string;
    timeline: {
        issueDate: number | null;
        expiryDate?: number | null;
    };
    image: string;
}) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    const merit = await prisma.merit.create({
        data: {
            userDataId: userData.id,
            title: data.title,
            issuer: data.issuer,
            meritType: data.meritType,
            summary: data.summary,
            issueDate: data.timeline.issueDate
                ? new Date(data.timeline.issueDate * 1000)
                : null,
            expiryDate: data.timeline.expiryDate
                ? new Date(data.timeline.expiryDate * 1000)
                : null,
            image: data.image,
        },
    });

    return merit;
}
