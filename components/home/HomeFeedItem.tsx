"use client";

import { useState } from "react";
import ProjectCard from "../content/cards/ProjectCard";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { UserIcon } from "../general/UserIcon";
import Link from "next/link";
import { toast } from "sonner";
import { likeProject } from "@/actions/content/project/likeProject";
import { saveProject } from "@/actions/content/project/saveProject";

type Props = {
    project: any;
    currentUserId: string;
};

const HomeFeedItem = ({ project, currentUserId }: Props) => {
    const [likes, setLikes] = useState(project.likes || []);
    const [saves, setSaves] = useState(project.saves || []);

    const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) {
            toast.error("You must be logged in to like projects.");
            return;
        }

        const isLiked = likes.some((u: any) => u.userId === currentUserId);

        const updatedLikes = isLiked
            ? likes.filter((u: any) => u.userId !== currentUserId)
            : [...likes, { userId: currentUserId }];

        setLikes(updatedLikes);

        const { error } = await likeProject(project.id, currentUserId);
        if (error) {
            toast.error(error);
            setLikes(likes);
        }
    };

    const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) {
            toast.error("You must be logged in to save projects.");
            return;
        }

        const isSaved = saves.some((u: any) => u.userId === currentUserId);

        const updatedSaves = isSaved
            ? saves.filter((u: any) => u.userId !== currentUserId)
            : [...saves, { userId: currentUserId }];

        setSaves(updatedSaves);

        const { error } = await saveProject(project.id, currentUserId);
        if (error) {
            toast.error(error);
            setSaves(saves); // revert
        }
    };

    const isLiked = likes.some((u: any) => u.userId === currentUserId);
    const isSaved = saves.some((u: any) => u.userId === currentUserId);

    return (
        <div className="snap-start h-full flex items-center justify-center">
            <div className="flex gap-2 md:gap-4 w-full px-2 lg:w-auto">
                <div className="flex-1 min-h-[500px]">
                    <ProjectCard
                        project={project}
                        width="lg:w-[500px] w-full"
                        height="lg:h-[600px] h-full"
                    />
                </div>
                <div className="flex flex-col items-center gap-4">
                    <Link href={`/profile/${project.author.username}`}>
                        <UserIcon
                            image={project.author.image}
                            size="size-10 bg-gray-700"
                        />
                    </Link>
                    <div className="flex flex-col items-center gap-4 mt-auto mb-2 text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleLike}
                                className={`transition-colors cursor-pointer ${
                                    isLiked
                                        ? "text-red-500"
                                        : "hover:text-blue-500"
                                }`}
                                aria-label="Like project"
                            >
                                <Heart
                                    className="size-8"
                                    fill={isLiked ? "currentColor" : "none"}
                                />
                            </button>
                            <span className="text-sm mt-1">{likes.length}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <button
                                className="hover:text-blue-500 transition-colors cursor-pointer"
                                aria-label="Comments"
                            >
                                <MessageCircle className="size-8" />
                            </button>
                            <span className="text-sm mt-1">0</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleSave}
                                className={`transition-colors cursor-pointer ${
                                    isSaved
                                        ? "text-yellow-500"
                                        : "hover:text-blue-500"
                                }`}
                                aria-label="Save project"
                            >
                                <Bookmark
                                    className="size-8"
                                    fill={isSaved ? "currentColor" : "none"}
                                />
                            </button>
                            <span className="text-sm mt-1">{saves.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeFeedItem;
