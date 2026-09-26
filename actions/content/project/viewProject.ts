"use server";

import { prisma } from "@/lib/prisma";
import { recordEngagement } from "@/lib/engagement";
import { notifyViewMilestones } from "@/lib/notify";
import { getSession } from "@/lib/session";

/**
 * Records that the signed-in user viewed a project (view count + Trending).
 * `_userId` is ignored: the session user is used.
 */
export async function viewProject(projectId: string, _userId?: string) {
    try {
        const session = await getSession();
        const userId = session?.user?.id;
        if (!userId) return { error: null };

        const [project, userData] = await Promise.all([
            prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
            prisma.userData.upsert({
                where: { userId },
                update: {},
                create: { userId },
                select: { id: true },
            }),
        ]);
        if (!project) return { error: "Project not found." };

        // Only a first-ever view from this person raises the view count.
        const seenBefore = await prisma.project.count({
            where: { id: projectId, views: { some: { id: userData.id } } },
        });

        await Promise.all([
            prisma.userData.update({
                where: { id: userData.id },
                data: { projectsViewed: { connect: { id: projectId } } },
            }),
            recordEngagement("view", "project", [projectId], userData.id),
        ]);

        if (!seenBefore) await notifyViewMilestones("project", [projectId]);

        return { error: null };
    } catch (error) {
        console.error("viewProject failed:", error);
        return { error: "Internal server error." };
    }
}
