import { getProfileData } from "@/actions/getProfileData";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { SocialsCard } from "@/components/profile/SocialsCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    Github,
    Globe,
    Instagram,
    Linkedin,
    MapPin,
    Youtube,
} from "lucide-react";
import { headers } from "next/headers";

export default async function Page({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let tUser = await prisma.user.findFirst({
        where: {
            username,
        },
    });

    if (!tUser) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="bg-gray-100 p-8 rounded shadow-md space-y-2">
                    <ReturnButton href="/" label="Home" />
                    <h1 className="text-xl font-semibold">User Not Found</h1>
                    <p>The user you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    tUser = {
        ...tUser,
        ...(await getProfileData(username)).profile,
    };

    return (
        <div className="flex flex-col overflow-x-scroll no-scrollbar lg:flex-row w-full py-10 px-[2%] lg:space-x-4 h-full">
            {/* Left/Main section */}
            <div className="w-full lg:w-[80%] space-y-4">
                <ProfileCard tUser={tUser} />

                {/* Social links for small/medium screens */}
                <div className="block lg:hidden">
                    <SocialsCard tUser={tUser} />
                </div>

                <div className="rounded-md overflow-hidden shadow-md w-full bg-gray-200 p-2">
                    Here will be a menu for projects, posts, reposts,
                    experiences
                </div>

                <div className="block lg:hidden bg-gray-200 p-2 font-medium shadow-md rounded-md">
                    Recommended accounts here.
                </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:block lg:w-[20%] space-y-4">
                <SocialsCard tUser={tUser} />
                <div className="bg-gray-200 p-2 font-medium shadow-md rounded-md">
                    Recommended accounts here.
                </div>
            </div>
        </div>
    );
}
