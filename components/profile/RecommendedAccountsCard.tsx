"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";

const recommendedAccounts = [
    {
        name: "Jane Doe",
        username: "janedoe",
        reason: "Popular in your region",
        avatar: "https://i.pravatar.cc/40?img=1",
    },
    {
        name: "John Smith",
        username: "johnsmith",
        reason: "Followed by people you follow",
        avatar: "https://i.pravatar.cc/40?img=2",
    },
    {
        name: "Emily Ray",
        username: "emilyray",
        reason: "Trending in tech",
        avatar: "https://i.pravatar.cc/40?img=3",
    },
    {
        name: "Mike Johnson",
        username: "mikej",
        reason: "New to the platform",
        avatar: "https://i.pravatar.cc/40?img=4",
    },
    {
        name: "Sophia Lee",
        username: "sophlee",
        reason: "Recommended by our algorithm",
        avatar: "https://i.pravatar.cc/40?img=5",
    },
    {
        name: "Alex Kim",
        username: "alexkim",
        reason: "Posts match your interests",
        avatar: "https://i.pravatar.cc/40?img=6",
    },
    {
        name: "Nina Patel",
        username: "ninapatel",
        reason: "Engaged in similar communities",
        avatar: "https://i.pravatar.cc/40?img=7",
    },
    {
        name: "Carlos Rivera",
        username: "carlosr",
        reason: "Often liked by your follows",
        avatar: "https://i.pravatar.cc/40?img=8",
    },
];

const RecommendedAccountsCard = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="bg-gray-200 h-[20rem] p-3 shadow-md rounded-md w-full flex flex-col">
                <Skeleton className="w-[60%] h-6 mb-3 rounded-md" />
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {[...Array(recommendedAccounts.length)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-2 rounded hover:bg-gray-300"
                        >
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="w-[50%] h-3 rounded-sm" />
                                <Skeleton className="w-[30%] h-2 rounded-sm" />
                                <Skeleton className="w-[80%] h-2 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 h-[20rem] p-3 shadow-md rounded-md w-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Recommended Accounts</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 yes-scrollbar">
                {recommendedAccounts.map((account, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-300 p-2 rounded"
                    >
                        <img
                            src={account.avatar}
                            alt={`${account.name}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-sm">
                                {account.name}
                            </div>
                            <div className="text-xs text-gray-600">
                                @{account.username}
                            </div>
                            <div className="text-xs text-gray-700 mt-1">
                                {account.reason}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedAccountsCard;
