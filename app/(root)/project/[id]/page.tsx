import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { HeaderCard } from "@/components/project/HeaderCard";
import { AuthorCard } from "@/components/project/AuthorCard";
import ContributorsCard from "@/components/project/ContributorsCard";
import ResourcesCard from "@/components/project/ResourcesCard";
import SkillsCard from "@/components/project/SkillsCard";
import { getProjectById } from "@/actions/content/project/getProject";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { getProfileData } from "@/actions/profile/getProfileData";
import GalleryCard from "@/components/project/GalleryCard";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const project = await getProjectById(id);
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
    const tProfile = (await getProfileData(project.userData.user.username))
        .profile;

    const isOwner = session?.user.id === project.userData.user.id;
    const hasItems = (arr: unknown) => Array.isArray(arr) && arr.length > 0;

    return (
        <div className="w-full flex space-y-5 flex-col my-5">
            <div className="flex lg:flex-row flex-col px-[2%] w-full gap-5">
                <div className="lg:flex-1">
                    <HeaderCard isOwner={isOwner} project={project} />
                </div>

                <div className="lg:w-[15rem] lg:flex flex-col space-y-5">
                    <AuthorCard
                        isOwner={isOwner}
                        tProfile={tProfile}
                        project={project}
                    />

                    <div className="hidden lg:flex flex-1 bg-gray-200 p-4 shadow-md rounded-md bg-[url('/assets/general/fillerImage.png')] bg-cover bg-center" />
                </div>
            </div>

            {(isOwner || hasItems(project.skills)) && (
                <div className="px-[2%]">
                    <SkillsCard
                        isOwner={isOwner}
                        skills={(project.skills as string[]) ?? []}
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
