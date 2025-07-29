"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/general/Skeleton";
import { User, Share2, Link2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const HeaderCard = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleShare = () => {
        const projectUrl = `${window.location.origin}/project/id`;
        navigator.clipboard.writeText(projectUrl);
        toast.success("Project link copied.");
    };

    // Dummy dates for the project
    const startDate = new Date("2024-01-10");
    const endDate = new Date("2024-06-20");
    const postedAt = new Date("2024-07-15");

    if (isLoading) {
        return (
            <div className="rounded-md overflow-hidden shadow-md w-full h-full">
                <div className="relative">
                    <Skeleton className="w-full h-[200px] md:h-[350px]" />
                    <div className="absolute left-[3%] -bottom-[10%] size-20 md:size-40 rounded-md border-3 border-gray-200">
                        <Skeleton className="w-full h-full rounded-md" />
                    </div>
                </div>

                <div className="bg-gray-200 p-4 pt-10 md:flex gap-8">
                    <div className="flex-1 flex flex-col space-y-4">
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-5/6 rounded-md" />
                        <Skeleton className="h-4 w-4/5 rounded-md" />
                        <Skeleton className="h-4 w-9/10 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4 rounded-sm" />
                            <Skeleton className="h-6 w-2/3 rounded-sm" />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-6 w-20 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start md:flex-col md:items-end mt-6 md:mt-0">
                        <Skeleton className="h-8 w-32 rounded-sm" />
                        <Skeleton className="h-8 w-20 rounded-sm" />
                        <Skeleton className="h-8 w-20 rounded-sm" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md overflow-hidden shadow-md w-full h-full">
            <div className="relative">
                <div className="w-full h-[200px] md:h-[350px] bg-gray-800" />
                <div className="absolute left-[3%] -bottom-[10%] size-20 md:size-40 rounded-md border-3 border-gray-200 flex items-center justify-center bg-gray-700">
                    <User className="text-gray-300 w-8 h-8 md:w-20 md:h-20" />
                </div>
            </div>

            <div className="bg-gray-200 p-4 font-medium pt-10 md:flex gap-8">
                {/* Left Side */}
                <div className="flex-1 flex flex-col">
                    <div>
                        <div className="text-[25px] font-bold">
                            This Is The Name Of Project
                        </div>

                        {/* Project Duration and Posted Date */}
                        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                <span>
                                    {format(startDate, "dd MMM, yyyy")} –{" "}
                                    {format(endDate, "dd MMM, yyyy")}
                                </span>
                            </div>
                            <span className="text-gray-500">
                                Posted on {format(postedAt, "dd MMM, yyyy")}
                            </span>
                        </div>

                        <div className="my-3 px-2 py-1 bg-green-200 w-fit rounded-md text-sm">
                            Completed
                        </div>

                        <div className="mt-2 whitespace-pre-line">
                            This is the description of the project. Lorem ipsum
                            dolor sit amet consectetur adipisicing elit. Dolore
                            tempora cupiditate deserunt voluptatum voluptas
                            accusamus praesentium.
                        </div>
                    </div>

                    {/* Links section */}
                    <div className="mt-4 text-sm flex flex-col">
                        <a
                            href="https://example.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center w-fit space-x-2 hover:brightness-90 bg-gray-200 px-2 py-1 rounded-sm cursor-pointer"
                        >
                            <Link2 className="w-4 h-4" />
                            <span className="truncate flex-1 text-sm">
                                https://example.com
                            </span>
                        </a>

                        <a
                            href="https://github.com/example"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center w-fit space-x-2 hover:brightness-90 bg-gray-200 px-2 py-1 rounded-sm cursor-pointer"
                        >
                            <Link2 className="w-4 h-4" />
                            <span className="truncate flex-1 text-sm">
                                https://github.com/example
                            </span>
                        </a>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start md:flex-col md:items-end mt-6 md:mt-0">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                    >
                        <Share2 className="w-4 h-4" />
                        Share Project
                    </button>
                    <div className="px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer">
                        Like
                    </div>
                    <div className="px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer">
                        Save
                    </div>
                </div>
            </div>
        </div>
    );
};
