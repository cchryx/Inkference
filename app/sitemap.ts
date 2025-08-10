import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/welcome`,
            lastModified: new Date(),
            changeFrequency: "always",
            priority: 1,
        },
    ];

    // Dynamic user profile routes
    const users = await prisma.user.findMany({
        select: { username: true, updatedAt: true },
    });
    const userRoutes: MetadataRoute.Sitemap = users.map((user) => ({
        url: `${baseUrl}/${user.username}`,
        lastModified: user.updatedAt || new Date(),
        changeFrequency: "always",
        priority: 0.7,
    }));

    // Dynamic project routes
    const projects = await prisma.project.findMany({
        select: { id: true, updatedAt: true },
    });
    const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
        url: `${baseUrl}/project/${project.id}`,
        lastModified: project.updatedAt || new Date(),
        changeFrequency: "always",
        priority: 0.7,
    }));

    return [...staticRoutes, ...userRoutes, ...projectRoutes];
}
