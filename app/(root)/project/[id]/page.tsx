import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { HeaderCard } from "@/components/project/HeaderCard";
import { AuthorCard } from "@/components/project/AuthorCard";
import ContributorsCard from "@/components/project/ContributorsCard";
import GalleryCard from "@/components/project/GalleryCard";
import ResourcesCard from "@/components/project/ResourcesCard";
import SkillsCard from "@/components/project/SkilsCard";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="w-full flex space-y-5 flex-col my-5">
            <div className="flex lg:flex-row flex-col px-[2%] w-full gap-5">
                <div className="lg:flex-1">
                    <HeaderCard />
                </div>
                <div className="lg:w-[15rem] flex flex-col space-y-5">
                    <AuthorCard />
                    <div className="flex-1 bg-gray-200 p-4 shadow-md rounded-md bg-[url('/assets/general/fillerImage.png')] bg-cover bg-center" />
                </div>
            </div>
            <div className="px-[2%]">
                <SkillsCard />
            </div>
            <div className="px-[2%]">
                <ContributorsCard />
            </div>
            <div className="px-[2%]">
                <GalleryCard />
            </div>
            <div className="px-[2%]">
                <ResourcesCard />
            </div>
        </div>
    );
}
