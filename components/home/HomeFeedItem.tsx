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
    item: any;
    currentUserId: string;
};

const HomeFeedItem = ({ item, currentUserId }: Props) => {
    // Only projects have likes/saves state & handlers
    const isProject = item.type === "project";
    const content = item.content;

    const [likes, setLikes] = useState(
        isProject ? content.data?.likes || [] : []
    );
    const [saves, setSaves] = useState(
        isProject ? content.data?.saves || [] : []
    );

    const author = content.data?.author || content.author || null;

    const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isProject) return; // no-op for non-projects
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

        const { error } = await likeProject(content.data.id, currentUserId);
        if (error) {
            toast.error(error);
            setLikes(likes);
        }
    };

    const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isProject) return; // no-op for non-projects
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

        const { error } = await saveProject(content.data.id, currentUserId);
        if (error) {
            toast.error(error);
            setSaves(saves); // revert on error
        }
    };

    const isLiked =
        isProject && likes.some((u: any) => u.userId === currentUserId);
    const isSaved =
        isProject && saves.some((u: any) => u.userId === currentUserId);

    // Content UI varies by type
    let contentRender;
    switch (item.type) {
        case "project":
            contentRender = (
                <ProjectCard
                    project={content.data}
                    width="lg:w-[50vh] w-full"
                    height="h-[60vh]"
                />
            );
            break;

        case "reel":
            contentRender = (
                <video
                    src={content.data.url}
                    controls
                    className="w-full rounded-md"
                    preload="metadata"
                />
            );
            break;

        case "note":
            contentRender = (
                <p className="whitespace-pre-wrap">{content.data.text}</p>
            );
            break;

        default:
            contentRender = (
                <p className="text-red-600">
                    Unknown post type: <code>{item.type}</code>
                </p>
            );
            break;
    }

    return (
        <div className="snap-start h-full flex flex-col items-center justify-center select-none">
            <div className="flex gap-2 md:gap-4 w-full px-2 lg:w-auto">
                <div className="flex-1">{contentRender}</div>

                {/* Right Sidebar: Author + Likes/Saves */}
                <div className="flex flex-col items-center gap-4">
                    {author?.username && (
                        <Link href={`/profile/${author.username}`}>
                            <UserIcon
                                image={author.image}
                                size="size-10 bg-gray-700"
                            />
                        </Link>
                    )}

                    <div className="flex flex-col items-center gap-4 mt-auto mb-2 text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={isProject ? handleLike : undefined}
                                className={`transition-colors cursor-pointer ${
                                    isLiked
                                        ? "text-red-500"
                                        : "hover:text-blue-500"
                                } ${
                                    !isProject
                                        ? "cursor-default opacity-50"
                                        : ""
                                }`}
                                aria-label="Like post"
                                disabled={!isProject}
                                tabIndex={isProject ? 0 : -1}
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
                                onClick={isProject ? handleSave : undefined}
                                className={`transition-colors cursor-pointer ${
                                    isSaved
                                        ? "text-yellow-500"
                                        : "hover:text-blue-500"
                                } ${
                                    !isProject
                                        ? "cursor-default opacity-50"
                                        : ""
                                }`}
                                aria-label="Save post"
                                disabled={!isProject}
                                tabIndex={isProject ? 0 : -1}
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
            {isProject && (
                <div className="w-auto text-left text-xs text-gray-400 select-none px-2 mt-2">
                    PROJECT
                </div>
            )}
        </div>
    );
};

export default HomeFeedItem;
