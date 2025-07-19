import { ReturnButton } from "@/components/auth/ReturnButton";
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
import { redirect } from "next/navigation";

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
    params: { username?: string };
}) {
    const p = await params;
    const username = p.username;

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
                <div className="rounded-md overflow-hidden shadow-md w-full">
                    <div className="relative">
                        <img
                            src="https://wallup.net/wp-content/uploads/2018/03/19/546507-forest-environment-lake-mountains-digital_art-water-landscape-waterfall-clouds.jpg"
                            alt="Scenic landscape"
                            className="w-full h-[200px] md:h-[300px] object-cover object-center"
                        />
                        <div className="absolute left-[3%] -bottom-[10%] w-20 h-20 md:w-40 md:h-40 rounded-full border-3 border-gray-200 flex items-center justify-center bg-gray-700">
                            {tUser?.image ? (
                                <img
                                    src={tUser.image}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="text-gray-300 w-8 h-8 md:w-20 md:h-20" />
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-200 p-4 font-medium pt-10 md:flex space-y-10">
                        <div className="flex-1 space-y-2">
                            <div>
                                <div className="text-[25px] font-bold">
                                    {tUser?.name}
                                </div>
                                <div className="text-muted-foreground">
                                    @{tUser?.username}
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <div>{0} Followers</div>
                                <div>{0} Following</div>
                            </div>
                            <div className="text-sm">
                                This will be where the bio is.
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-0 md:space-y-2 justify-center md:justify-start md:flex-col md:items-end">
                            <div className="px-3 py-1 rounded-sm bg-gray-300">
                                Follow
                            </div>
                            <div className="px-3 py-1 rounded-sm bg-gray-300">
                                Add Friend
                            </div>
                        </div>
                    </div>
                </div>

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
