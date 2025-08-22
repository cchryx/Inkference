"use server";

import { prisma } from "@/lib/prisma";
import { getUserData } from "../../users/getUserData";

export async function deleteSkill(skillId: string, projectId?: string) {
    const userData = await getUserData();
    if (!userData || "error" in userData) return { error: "Unauthorized." };

    // Fetch the skill including connected users
    const skill = await prisma.skill.findUnique({
        where: { id: skillId },
        include: { users: true },
    });

    if (!skill) return { error: "Skill not found." };

    if (projectId) {
        // Disconnect skill from the specified project only
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { skills: true },
        });

        if (!project) return { error: "Project not found." };

        await prisma.project.update({
            where: { id: projectId },
            data: {
                skills: { disconnect: { id: skillId } },
            },
        });

        // Re-fetch the skill's users after disconnect
        const updatedSkill = await prisma.skill.findUnique({
            where: { id: skillId },
            include: { users: true },
        });

        // If no users remain and no icon, delete the skill
        if (
            updatedSkill &&
            updatedSkill.users.length === 0 &&
            !updatedSkill.iconImage
        ) {
            await prisma.skill.delete({ where: { id: skillId } });
        }

        return { error: null };
    }

    // If no projectId provided → full deletion logic

    // Disconnect skill from projects owned by this user
    const projects = await prisma.project.findMany({
        where: {
            userDataId: userData.id,
            skills: { some: { id: skillId } },
        },
        select: { id: true },
    });

    await Promise.all(
        projects.map((project) =>
            prisma.project.update({
                where: { id: project.id },
                data: {
                    skills: { disconnect: { id: skillId } },
                },
            })
        )
    );

    // Disconnect skill from experiences owned by this user
    const experiences = await prisma.experience.findMany({
        where: {
            userDataId: userData.id,
            skills: { some: { id: skillId } },
        },
        select: { id: true },
    });

    await Promise.all(
        experiences.map((exp) =>
            prisma.experience.update({
                where: { id: exp.id },
                data: {
                    skills: { disconnect: { id: skillId } },
                },
            })
        )
    );

    if (
        skill.users.length === 1 &&
        skill.users[0].id === userData.id &&
        !skill.iconImage
    ) {
        // Only this user has the skill → delete it
        await prisma.skill.delete({ where: { id: skillId } });
    } else {
        // More users have it → just disconnect from current user
        await prisma.userData.update({
            where: { id: userData.id },
            data: {
                skills: { disconnect: { id: skillId } },
            },
        });
    }

    return { error: null };
}
