import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { HeaderCard } from "@/components/content/project/HeaderCard";
import { AuthorCard } from "@/components/content/project/AuthorCard";
import ContributorsCard from "@/components/content/project/ContributorsCard";
import ResourcesCard from "@/components/content/project/ResourcesCard";
import SkillsCard from "@/components/content/project/SkillsCard";
import { getProjectById } from "@/actions/content/project/getProject";
import { ReturnButton } from "@/components/auth/ReturnButton";
import GalleryCard from "@/components/content/project/GalleryCard";
import { prisma } from "@/lib/prisma";
import { previewUrl } from "@/lib/imageUrl";
import { cache } from "react";
import { canViewProject, getCurrentViewer } from "@/lib/visibility";
import { Metadata } from "next";

// Loads the project, but only if the viewer is allowed to see it.
// Hidden projects look exactly like missing ones.
const getProjectData = cache(async (id: string) => {
    const [projectData, viewer] = await Promise.all([getProjectById(id), getCurrentViewer()]);
    if (!projectData || "error" in projectData) return projectData;
    if (!(await canViewProject(id, viewer))) return { error: "Project not found." };
    return projectData;
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    const projectData: any = await getProjectData(id);

    // If no project found
    if (!projectData || "error" in projectData) {
        return {
            title: `Project not found`,
            description: `The project with this ID does not exist or may have been removed.`,
            openGraph: {
                title: `Project not found`,
                description: `The project with this ID does not exist or may have been removed.`,
                url: `/project/${id}`,
            },
            twitter: {
                card: "summary",
                title: `Project not found`,
                description: `The project with this ID does not exist or may have been removed.`,
            },
        };
    }

    // Smaller copies so link previews (Discord etc.) load faster.
    const bannerImage = projectData.bannerImage
        ? previewUrl(projectData.bannerImage, 1200)
        : "/assets/general/fillerImage.png";
    const iconImage = projectData.iconImage
        ? previewUrl(projectData.iconImage, 400)
        : "/assets/general/fillers/project.png";

    return {
        title: projectData.name,
        description:
            projectData.summary ||
            "View details about this project on our platform.",
        openGraph: {
            title: projectData.name,
            description:
                projectData.summary ||
                "View details about this project on our platform.",
            url: `/project/${projectData.id}`,
            images: [
                {
                    url: bannerImage,
                    alt: `${projectData.name} banner`,
                },
                {
                    url: iconImage,
                    alt: `${projectData.name} icon`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: projectData.name,
            description:
                projectData.summary ||
                "View details about this project on our platform.",
            images: [bannerImage],
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [session, project] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        getProjectData(id),
    ]);
    if (!project || "error" in project) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="bg-gray-100 p-8 rounded shadow-md space-y-2">
                    <ReturnButton href="/" label="Home" />
                    <h1 className="text-xl font-semibold">Project Not Found</h1>
                    <p>The project you are looking for does not exist.</p>
                </div>
            </div>
        );
    }
    // The author card only needs a bio and two numbers: count them instead
    // of loading the author's whole profile.
    const author = await prisma.user.findUnique({
        where: { id: project.userData.userId },
        select: {
            Profile: { select: { bio: true } },
            Relationships: { select: { _count: { select: { followers: true } } } },
            UserData: { select: { _count: { select: { projects: true } } } },
        },
    });
    const tProfile = { bio: author?.Profile?.bio ?? "" };

    const isOwner = session?.user.id === project.userData.user.id;
    const hasItems = (arr: unknown) => Array.isArray(arr) && arr.length > 0;

    return (
        <div className="w-full flex space-y-5 flex-col my-5">
            <div className="flex lg:flex-row flex-col px-[2%] w-full gap-5">
                <div className="lg:flex-1">
                    <HeaderCard
                        isOwner={isOwner}
                        session={session}
                        project={project}
                    />
                </div>

                <div className="lg:w-[15rem] lg:flex flex-col space-y-5">
                    <AuthorCard
                        isOwner={isOwner}
                        tProfile={tProfile}
                        followerCount={author?.Relationships?._count.followers ?? 0}
                        projectCount={author?.UserData?._count.projects ?? 0}
                        project={project}
                    />

                    <div className="hidden lg:flex flex-1 bg-gray-200 p-4 shadow-md rounded-md bg-[url('/assets/general/fillerImage.png')] bg-cover bg-center" />
                </div>
            </div>

            {(isOwner || hasItems(project.skills)) && (
                <div className="px-[2%]">
                    <SkillsCard
                        isOwner={isOwner}
                        skills={project.skills}
                        projectId={project.id}
                    />
                </div>
            )}

            {/* Contributors */}
            {(isOwner || hasItems(project.contributors)) && (
                <div className="px-[2%]">
                    <ContributorsCard
                        isOwner={isOwner}
                        projectId={project.id}
                        ownerId={project.userData.user.id}
                        contributors={
                            (project.contributors as any[])?.map((c) => ({
                                id: c.user?.id ?? c.id,
                                name: c.user?.name ?? c.name,
                                username: c.user?.username ?? c.username,
                                image: c.user?.image ?? c.image,
                            })) ?? []
                        }
                    />
                </div>
            )}

            {(isOwner || hasItems(project.galleryImages)) && (
                <div className="px-[2%]">
                    <GalleryCard
                        isOwner={isOwner}
                        projectId={project.id}
                        galleryImages={project.galleryImages}
                    />
                </div>
            )}

            {/* Resources */}
            {(isOwner || hasItems(project.projectResources)) && (
                <div className="px-[2%]">
                    <ResourcesCard
                        isOwner={isOwner}
                        projectId={project.id}
                        resources={(project.projectResources as any[]) ?? []}
                    />
                </div>
            )}
        </div>
    );
}
