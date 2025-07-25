"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/general/Skeleton";
import { User } from "lucide-react";

export const ProfileCard = ({ tUser }: { tUser: any }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-md overflow-hidden shadow-md w-full bg-[#e4e6eb]">
                {/* Cover banner */}
                <div className="relative">
                    <Skeleton className="w-full h-[200px] md:h-[300px]" />

                    {/* Avatar */}
                    <div className="absolute left-[3%] -bottom-12 w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white">
                        <Skeleton className="w-full h-full rounded-full" />
                    </div>
                </div>

                {/* Content section */}
                <div className="pt-16 px-4 pb-6 md:flex justify-between items-start bg-gray-200">
                    {/* Left section */}
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                        <Skeleton className="h-4 w-1/3 rounded-md" />
                        <div className="flex gap-3">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                    </div>

                    {/* Right section: Buttons */}
                    <div className="flex flex-col gap-3 mt-6 md:mt-0 md:items-end">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                </div>
            </div>
        );
    }

    return (
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
    );
};
