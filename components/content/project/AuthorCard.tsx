"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/general/Skeleton";
import { User } from "lucide-react";
import Link from "next/link";
import { UserIcon } from "@/components/general/UserIcon";

type Props = {
    isOwner: boolean;
    project: any;
    tProfile: any;
    tProjects: any[];
    tFollowers: any[];
};

export const AuthorCard = ({
    isOwner,
    project,
    tProfile,
    tFollowers,
    tProjects,
}: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const tUser = project.userData.user;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="relative rounded-md overflow-hidden shadow-md w-full p-4 bg-[#e4e6eb]">
                {/* Skeleton content layer */}
                <div className="relative z-10">
                    {/* Title */}
                    <Skeleton className="h-6 w-2/3 mb-4 rounded-md" />

                    {/* Mobile skeleton layout */}
                    <div className="flex flex-col lg:hidden gap-4">
                        <div className="flex gap-4 items-start">
                            <Skeleton className="w-16 h-16 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3 rounded-md" />
                                <Skeleton className="h-3 w-1/2 rounded-md" />
                                <Skeleton className="h-3 w-full rounded-md" />
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-2">
                            <Skeleton className="h-6 w-24 rounded-md" />
                            <Skeleton className="h-6 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-8 w-36 rounded-md" />
                    </div>

                    {/* Desktop skeleton layout */}
                    <div className="hidden lg:flex flex-col items-center text-center">
                        <Skeleton className="w-32 h-32 rounded-full" />
                        <div className="mt-4 space-y-2">
                            <Skeleton className="h-5 w-32 rounded-md mx-auto" />
                            <Skeleton className="h-4 w-20 rounded-md mx-auto" />
                        </div>
                        <div className="mt-3 space-y-1 w-full px-8">
                            <Skeleton className="h-3 w-full rounded-md" />
                            <Skeleton className="h-3 w-5/6 rounded-md" />
                            <Skeleton className="h-3 w-4/5 rounded-md" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Skeleton className="h-6 w-24 rounded-md" />
                            <Skeleton className="h-6 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-8 w-36 mt-4 rounded-md" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-md overflow-hidden shadow-md w-full p-4 bg-gray-200 select-none">
            {/* Content layer */}
            <div className="relative z-10">
                {/* Top Title */}
                <div className="text-lg font-semibold text-gray-700 mb-4">
                    Project Author
                </div>

                {/* Mobile layout (horizontal) */}
                <div className="flex flex-col lg:hidden gap-4">
                    <div className="flex gap-4 items-start">
                        <UserIcon
                            image={tUser?.image || undefined}
                            size="w-16 h-16 flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <div className="font-semibold text-base truncate">
                                {tUser.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                @{tUser.username}
                            </div>
                            <div className="text-xs text-gray-700 mt-1 truncate">
                                {tProfile.bio}
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-4 py-1 px-2 bg-gray-300 rounded-md w-fit text-sm">
                        <div>{tFollowers.length} Followers</div>
                        <div>{tProjects.length} Projects</div>
                    </div>
                    <Link href={`/profile/${tUser.username}`}>
                        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-4 py-2 rounded-md transition cursor-pointer">
                            Checkout Profile
                        </button>
                    </Link>
                </div>

                {/* Desktop layout (vertical) */}
                <div className="hidden lg:flex flex-col items-center text-center">
                    <UserIcon
                        size="size-32"
                        image={tUser?.image || undefined}
                    />

                    <div className="mt-4 max-w-full">
                        <div
                            className="text-2xl font-bold truncate"
                            title={tUser.name}
                        >
                            {tUser.name}
                        </div>
                        <div
                            className="text-muted-foreground truncate"
                            title={`@${tUser.username}`}
                        >
                            @{tUser.username}
                        </div>
                    </div>

                    <div className="text-sm text-gray-700 mt-2 max-w-md text-start overflow-auto max-h-75">
                        {tProfile.bio}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-2 w-fit ">
                        <div className="py-1 px-3 bg-gray-300 rounded-md text-sm">
                            {tFollowers.length} Followers
                        </div>
                        <div className="py-1 px-3 bg-gray-300 rounded-md text-sm">
                            {tProjects.length} Projects
                        </div>
                    </div>
                    <Link href={`/profile/${tUser.username}`}>
                        <button className="mt-4 bg-gray-800 hover:bg-gray-900 text-white text-sm px-4 py-2 rounded-md transition cursor-pointer">
                            Checkout Profile
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
