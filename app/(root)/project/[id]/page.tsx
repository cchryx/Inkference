import { HeaderCard } from "@/components/project/HeaderCard";
import { AuthorCard } from "@/components/project/AuthorCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ContributorsCard from "@/components/project/ContributorsCard";
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

    return (
        <div className="w-full flex space-y-5 flex-col my-5">
            <div className="flex lg:flex-row flex-col px-[2%] w-full gap-5">
                <div className="lg:flex-1">
                    <HeaderCard />
                </div>
                <div className="lg:w-[15rem]">
                    <AuthorCard />
                </div>
            </div>
            <div className="px-[2%]">
                <ContributorsCard />
            </div>
            <div className="px-[2%]">
                <GalleryCard />
            </div>
        </div>
    );
}
