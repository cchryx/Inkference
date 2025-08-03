"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/general/Skeleton";
import { User, Share2, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { toggleFollowUser } from "@/actions/users/toggleFollowUser";

type ProfileCardProps = {
    tUser: any;
    currentUserId: string | undefined;
};

export const ProfileCard = ({ tUser, currentUserId }: ProfileCardProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [followers, setFollowers] = useState(
        tUser?.relationships.followers || []
    );

    const handleFollow = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to follow users.");
            return;
        }

        const isFollowed = followers.some(
            (u: any) => u.userId === currentUserId
        );

        const updatedFollowers = isFollowed
            ? followers.filter((u: any) => u.userId !== currentUserId)
            : [...followers, { userId: currentUserId }];

        setFollowers(updatedFollowers);

        const { error } = await toggleFollowUser(currentUserId, tUser.id);
        if (error) {
            toast.error(error);
            setFollowers(followers);
        }
    };

    const handleShare = () => {
        const profileUrl = `${window.location.origin}/profile/${tUser?.username}`;
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied.");
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-md overflow-hidden h-full shadow-md w-full bg-[#e4e6eb]">
                <div className="relative">
                    <Skeleton className="w-full h-[200px] md:h-[350px]" />
                    <div className="absolute left-[3%] -bottom-12 w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white">
                        <Skeleton className="w-full h-full rounded-full" />
                    </div>
                </div>
                <div className="pt-16 px-4 pb-6 md:flex justify-between items-start bg-gray-200">
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                        <Skeleton className="h-4 w-1/3 rounded-md" />
                        <div className="flex gap-3">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-5/6 rounded-md" />
                        <Skeleton className="h-4 w-4/5 rounded-md" />
                        <Skeleton className="h-4 w-9/10 rounded-md" />
                    </div>
                    <div className="flex flex-col gap-3 mt-6 md:mt-0 md:items-end">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-4 w-18 rounded-md" />
                        <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md overflow-hidden shadow-md w-full h-full">
            <div className="relative">
                {tUser?.bannerImage ? (
                    <img
                        src={tUser.bannerImage}
                        alt="User banner"
                        className="w-full h-[200px] md:h-[350px] object-cover object-center"
                    />
                ) : (
                    <div className="w-full h-[200px] md:h-[350px] bg-gray-800" />
                )}
                <div className="absolute left-[3%] -bottom-[10%] w-20 h-20 md:w-40 md:h-40 rounded-full border-3 border-gray-200 flex items-center justify-center bg-gray-700">
                    {tUser?.image ? (
                        <img
                            src={tUser.image}
                            className="w-full h-full rounded-full object-cover"
                            alt={tUser.name ?? "User avatar"}
                        />
                    ) : (
                        <User className="text-gray-300 w-8 h-8 md:w-20 md:h-20" />
                    )}
                </div>
            </div>

            <div className="bg-gray-200 p-4 font-medium pt-10 md:flex space-y-10 h-full">
                <div className="flex-1 space-y-2 min-w-0">
                    <div>
                        <div
                            className="text-[25px] font-bold truncate max-w-[20rem]"
                            title={tUser?.name}
                        >
                            {tUser?.name}
                        </div>
                        <div
                            className="text-muted-foreground truncate max-w-[24rem]"
                            title={`@${tUser?.username}`}
                        >
                            @{tUser?.username}
                        </div>
                    </div>
                    <div className="flex space-x-4 py-1 px-2 bg-gray-300 rounded-md w-fit">
                        <div>{followers.length} Followers</div>
                        <div>{0} Following</div>
                    </div>
                    <div className="text-sm whitespace-pre-line">
                        {tUser.bio}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start md:flex-col md:items-end">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                    >
                        <Share2 className="w-4 h-4" />
                        Share Profile
                    </button>

                    {currentUserId !== tUser.id && (
                        <button
                            onClick={handleFollow}
                            className={`flex items-center gap-2 px-3 py-1 rounded-sm text-sm cursor-pointer transition ${
                                followers.some(
                                    (u: any) => u.userId === currentUserId
                                )
                                    ? "bg-gray-500 text-white"
                                    : "bg-gray-300 hover:bg-gray-400"
                            }`}
                        >
                            {followers.some(
                                (u: any) => u.userId === currentUserId
                            ) ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Follow
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
