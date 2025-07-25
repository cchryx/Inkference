import { ReturnButton } from "@/components/auth/ReturnButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import Profile from "@/components/settings/Profile";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    Github,
    Globe,
    Instagram,
    Linkedin,
    MapPin,
    User,
    Youtube,
} from "lucide-react";
import { headers } from "next/headers";

function SocialLinks() {
    return (
        <div className="bg-gray-200 p-4 font-medium shadow-md rounded-md">
            {/* Social Links */}
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
            </div>
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
            </div>
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
            </div>
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
            </div>
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
            </div>
            <div className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-3 py-1 rounded-sm cursor-pointer">
                <Globe className="w-4 h-4" />
                <span>Personal Website</span>
            </div>
        </div>
    );
}

export default async function Page({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const tUser = await prisma.user.findFirst({
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

    return (
        <div className="flex flex-col lg:flex-row w-full py-10 px-[2%] lg:space-x-4">
            {/* Left/Main section */}
            <div className="w-full lg:w-[80%] space-y-4">
                <ProfileCard tUser={tUser} />

                {/* Social links for small/medium screens */}
                <div className="block lg:hidden">
                    <SocialLinks />
                </div>

                <div className="rounded-md overflow-hidden shadow-md w-full bg-gray-200 p-4">
                    Here will be a menu for projects, posts, reposts,
                    experiences
                </div>

                <div className="block lg:hidden bg-gray-200 p-4 font-medium shadow-md rounded-md">
                    Recommended accounts here.
                </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:block lg:w-[20%] space-y-4">
                <SocialLinks />
                <div className="bg-gray-200 p-4 font-medium shadow-md rounded-md">
                    Recommended accounts here.
                </div>
            </div>
        </div>
    );
}
