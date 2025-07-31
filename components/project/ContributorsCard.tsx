"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { ChevronDown, ChevronRight, Pen, Pencil } from "lucide-react";

const con = [
    {
        name: "Jane Doe",
        username: "janedoe",
        bio: "Frontend developer and designer.",
        avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
        name: "John Smith",
        username: "johnsmith",
        bio: "Backend wizard with a passion for APIs.",
        avatar: "https://i.pravatar.cc/100?img=2",
    },
    {
        name: "Emily Ray",
        username: "emilyray",
        bio: "Tech lead and open-source contributor.",
        avatar: "https://i.pravatar.cc/100?img=3",
    },
    {
        name: "Mike Johnson",
        username: "mikej",
        bio: "Full-stack enthusiast and cloud geek.",
        avatar: "https://i.pravatar.cc/100?img=4",
    },
];

type Props = {
    isOwner: boolean;
    contributors: any;
};

const ContributorsCard = ({ isOwner, contributors }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleMinimize = () => setIsMinimized((prev) => !prev);

    if (isLoading) {
        return (
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-[30%] h-6 rounded-md" />
                </div>
                <div className="flex-1 overflow-x-auto flex gap-3 pb-1 whitespace-nowrap">
                    {[...Array(contributors.length)].map((_, i) => (
                        <div
                            key={i}
                            className="w-[20rem] flex-shrink-0 flex items-start gap-3 p-3 rounded-md bg-gray-300"
                        >
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-1 mt-1">
                                <Skeleton className="w-[60%] h-4 rounded-sm" />
                                <Skeleton className="w-[40%] h-3 rounded-sm" />
                                <Skeleton className="w-[90%] h-2 rounded-sm" />
                                <Skeleton className="w-[70%] h-2 rounded-sm" />
                                <Skeleton className="w-[50%] h-2 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <h2 className="text-lg font-semibold">
                        Project Contributors ({contributors.length})
                    </h2>
                    {isOwner && (
                        <button
                            onClick={() => {}}
                            className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={toggleMinimize}
                    className="text-gray-600 hover:text-black transition cursor-pointer"
                >
                    {isMinimized ? (
                        <ChevronRight className="size-6" />
                    ) : (
                        <ChevronDown className="size-6" />
                    )}
                </button>
            </div>

            {!isMinimized && contributors.length > 0 && (
                <div className="flex-1 overflow-x-auto flex gap-3 pr-1 whitespace-nowrap yes-scrollbar">
                    {con.map((contributor, index) => (
                        <div
                            key={index}
                            className="w-[20rem] mb-3 flex-shrink-0 flex gap-1 bg-gray-300 p-3 rounded-md hover:brightness-[90%] cursor-pointer space-x-2"
                        >
                            <img
                                src={contributor.avatar}
                                alt={`${contributor.name}'s avatar`}
                                className="w-12 h-12 rounded-full object-cover mb-1"
                            />
                            <div className="text-xs text-gray-700 line-clamp-3">
                                <div className="font-semibold text-sm">
                                    {contributor.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                    @{contributor.username}
                                </div>
                                {contributor.bio}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContributorsCard;
