"use server";

import { getUserData } from "@/actions/users/getUserData";
import { prisma } from "@/lib/prisma";

export async function addSkill(data: { name: string }, projectId?: string) {
    const userData = await getUserData();

    if (!userData || "error" in userData || !userData.userId) {
        return { error: "Unauthorized or no user data found." };
    }

    const skillName = data.name.trim();

    // Check if skill already exists
    let skill = await prisma.skill.findFirst({
        where: { name: skillName },
    });

    if (!skill) {
        // Create skill if it doesn't exist
        skill = await prisma.skill.create({
            data: { name: skillName },
        });
    }

    if (projectId) {
        // Connect skill to project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                skills: { connect: { id: skill.id } },
            },
        });
    } else {
        // Connect skill to current user
        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                skills: { connect: { id: skill.id } },
            },
        });
    }

    return skill;
}
