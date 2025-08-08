"use client";

import { useState } from "react";
import { HOMETOP_LINKS } from "@/constants";
import Topbar from "../root/Topbar";
import ProjectCard from "../content/cards/ProjectCard";
import { useForYouFeed } from "@/hooks/useForYouFeed";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { UserIcon } from "../general/UserIcon";
import Loader from "../general/Loader";
import { Skeleton } from "../general/Skeleton";
import Link from "next/link";

const HomeWrapper = () => {
    const [active, setActive] = useState("for_you");

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useForYouFeed();

    // Flatten all pages' items (the feed items)
    const feedItems = data ? data.pages.flatMap((page) => page.items) : [];

    // Map feed items of type "project" to ProjectCard props
    const feedProjects = feedItems
        .filter((item) => item.type === "project")
        .map((item) => ({ ...item.content }));

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom =
            target.scrollHeight - target.scrollTop <= target.clientHeight + 10; // threshold 10px

        if (isAtBottom && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    return (
        <>
            <Topbar
                active={active}
                setActive={setActive}
                links={HOMETOP_LINKS}
            />

            <div
                className={`flex-1 snap-y snap-mandatory no-scrollbar h-full ${
                    status === "pending"
                        ? "overflow-y-hidden"
                        : "overflow-y-scroll"
                }`}
                onScroll={status !== "pending" ? handleScroll : undefined}
            >
                {status === "pending" && (
                    <div className="snap-start h-full flex items-center justify-center">
                        <div className="flex gap-2 w-full px-2 lg:w-auto md:gap-4">
                            {/* Skeleton for ProjectCard */}
                            <Skeleton className="flex-1 min-h-[500px] lg:w-[500px] rounded-md" />

                            <div className="flex flex-col items-center gap-4">
                                {/* User icon skeleton */}
                                <Skeleton className="w-10 h-10 rounded-full" />

                                <div className="flex flex-col items-center gap-4 mt-auto mb-2">
                                    {/* Likes */}
                                    <div className="flex flex-col items-center">
                                        <Heart className="size-8" />
                                        <Skeleton className="w-6 h-4 mt-1 rounded" />
                                    </div>

                                    {/* Comments */}
                                    <div className="flex flex-col items-center">
                                        <MessageCircle className="size-8" />
                                        <Skeleton className="w-6 h-4 mt-1 rounded" />
                                    </div>

                                    {/* Save */}
                                    <div className="flex flex-col items-center">
                                        <Bookmark className="size-8" />
                                        <Skeleton className="w-6 h-4 mt-1 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <p className="p-4 text-center text-red-600">
                        Error: {(error as Error)?.message ?? "Unknown error"}
                    </p>
                )}

                {feedProjects.length === 0 && status === "success" && (
                    <p className="p-4 text-center">No projects found</p>
                )}

                {feedProjects.map((project, i) => (
                    <div
                        key={i}
                        className="snap-start h-full flex items-center justify-center"
                    >
                        <div className="flex gap-2 md:gap-4 w-full px-2 lg:w-auto">
                            <div className="flex-1 min-h-[500px]">
                                <ProjectCard
                                    project={project}
                                    width="lg:w-[500px] w-full"
                                    height="lg:h-[500px] h-full"
                                />
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <Link
                                    href={`/profile/${project.author.username}`}
                                    className="cursor-pointer"
                                    aria-label={`Go to ${project.author.username}'s profile`}
                                >
                                    <UserIcon
                                        image={project.author.image}
                                        size="size-10 bg-gray-700"
                                    />
                                </Link>
                                <div className="flex flex-col items-center gap-4 mt-auto mb-2 text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center">
                                        <button
                                            aria-label="Likes"
                                            className="hover:text-blue-500 transition-colors cursor-pointer"
                                            type="button"
                                        >
                                            <Heart className="size-8" />
                                        </button>
                                        <span className="text-sm mt-1">
                                            {project.likes.length}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            aria-label="Comments"
                                            className="hover:text-blue-500 transition-colors cursor-pointer"
                                            type="button"
                                        >
                                            <MessageCircle className="size-8" />
                                        </button>
                                        <span className="text-sm mt-1">0</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            aria-label="Save project"
                                            className="hover:text-blue-500 transition-colors cursor-pointer"
                                            type="button"
                                        >
                                            <Bookmark className="size-8" />
                                        </button>
                                        <span className="text-sm mt-1">
                                            {project.saves.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isFetchingNextPage && (
                    <div className="flex items-center justify-center w-full py-4">
                        <Loader color="black" size={10} />
                    </div>
                )}

                {!hasNextPage && feedProjects.length > 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                        That’s all for now. Maybe try scrolling up again?
                    </div>
                )}
            </div>
        </>
    );
};

export default HomeWrapper;
