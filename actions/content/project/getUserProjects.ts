import { prisma } from "@/lib/prisma";
import { getUserData } from "../getUserData";

export async function getUserProjects(userId?: string) {
    const userData = await getUserData(userId);

    if (!userData || "error" in userData) {
        return [];
    }

    const projects = await prisma.project.findMany({
        where: { userDataId: userData.id },
        select: {
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
            description: true,
            skills: true,
        },
        orderBy: [
            { endDate: { sort: "desc", nulls: "last" } },
            { startDate: "desc" },
        ],
    });

    return projects;
}
