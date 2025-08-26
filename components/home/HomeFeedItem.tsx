"use client";

import { useState } from "react";
import ProjectCard from "../content/cards/ProjectCard";
import PostCard from "../content/cards/PostCard";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { UserIcon } from "../general/UserIcon";
import Link from "next/link";
import { toast } from "sonner";
import { likeProject } from "@/actions/content/project/likeProject";
import { saveProject } from "@/actions/content/project/saveProject";
import { likePost } from "@/actions/content/post/likePost";
import { savePost } from "@/actions/content/post/savePost";

type Props = {
    item: any;
    currentUserId: string;
};

const HomeFeedItem = ({ item, currentUserId }: Props) => {
    const isProject = item.type === "project";
    const isPost = item.type === "post";
    const content = item.content;

    const [likes, setLikes] = useState(
        isProject
            ? content.data?.likes || []
            : isPost
            ? content.likes || []
            : []
    );
    const [saves, setSaves] = useState(
        isProject
            ? content.data?.saves || []
            : isPost
            ? content.saves || []
            : []
    );

    const author = content.data?.author || content.author || null;

    // Unified Like handler
    const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) {
            toast.error("You must be logged in to like.");
            return;
        }

        const isLiked = likes.some((u: any) => u.userId === currentUserId);
        const updatedLikes = isLiked
            ? likes.filter((u: any) => u.userId !== currentUserId)
            : [...likes, { userId: currentUserId }];

        setLikes(updatedLikes);

        let result;
        if (isProject)
            result = await likeProject(content.data.id, currentUserId);
        if (isPost) result = await likePost(content.id, currentUserId);

        if (result?.error) {
            toast.error(result.error);
            setLikes(likes); // revert
        }
    };

    // Unified Save handler
    const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) {
            toast.error("You must be logged in to save.");
            return;
        }

        const isSaved = saves.some((u: any) => u.userId === currentUserId);
        const updatedSaves = isSaved
            ? saves.filter((u: any) => u.userId !== currentUserId)
            : [...saves, { userId: currentUserId }];

        setSaves(updatedSaves);

        let result;
        if (isProject)
            result = await saveProject(content.data.id, currentUserId);
        if (isPost) result = await savePost(content.id, currentUserId);

        if (result?.error) {
            toast.error(result.error);
            setSaves(saves); // revert
        }
    };

    const isLiked =
        (isProject || isPost) &&
        likes.some((u: any) => u.userId === currentUserId);
    const isSaved =
        (isProject || isPost) &&
        saves.some((u: any) => u.userId === currentUserId);

    // Render content by type
    const contentRender = isProject ? (
        <ProjectCard
            project={content.data}
            width="lg:w-[50vh] w-full"
            height="h-[60vh]"
        />
    ) : isPost ? (
        <PostCard
            post={content}
            description={content.description}
            location={content.location}
        />
    ) : (
        <p className="text-red-600">
            Unknown post type: <code>{item.type}</code>
        </p>
    );

    return (
        <div className="snap-start h-full flex flex-col items-center justify-center select-none w-full">
            {/* Author info */}
            {author?.username && (
                <div className="flex items-center gap-2 w-full px-3 py-2 mb-2 md:hidden bg-gray-100">
                    <Link href={`/profile/${author.username}`}>
                        <UserIcon
                            image={author.image}
                            size="size-8 bg-gray-700"
                        />
                    </Link>
                    <div className="flex flex-col">
                        {author.name && (
                            <Link
                                href={`/profile/${author.username}`}
                                className="text-sm font-medium leading-tight"
                            >
                                {author.name}
                            </Link>
                        )}
                        <Link
                            href={`/profile/${author.username}`}
                            className="text-xs text-gray-500 dark:text-gray-400"
                        >
                            @{author.username}
                        </Link>
                    </div>
                </div>
            )}

            <div className="flex gap-2 md:gap-4 w-full px-2 lg:w-auto justify-center">
                <div className="lg:flex-1 w-full">{contentRender}</div>

                {/* Right Sidebar (desktop only) */}
                <div className="hidden md:flex flex-col items-center gap-4">
                    {author?.username && (
                        <Link href={`/profile/${author.username}`}>
                            <UserIcon
                                image={author.image}
                                size="size-10 bg-gray-700"
                            />
                        </Link>
                    )}

                    <div className="flex flex-col items-center gap-4 mt-auto mb-2 text-gray-500 dark:text-gray-400">
                        <ActionButtons
                            isProject={isProject || isPost} // allow posts
                            isLiked={isLiked}
                            likes={likes}
                            isSaved={isSaved}
                            saves={saves}
                            handleLike={handleLike}
                            handleSave={handleSave}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom bar (mobile only) */}
            <div className="flex md:hidden justify-around w-full py-2 text-gray-500 dark:text-gray-400">
                <ActionButtons
                    isProject={isProject || isPost}
                    isLiked={isLiked}
                    likes={likes}
                    isSaved={isSaved}
                    saves={saves}
                    handleLike={handleLike}
                    handleSave={handleSave}
                />
            </div>
        </div>
    );
};

const ActionButtons = ({
    isProject,
    isLiked,
    likes,
    isSaved,
    saves,
    handleLike,
    handleSave,
}: any) => (
    <>
        {/* Mobile bottom bar */}
        <div className="flex md:hidden justify-between items-center w-full px-4 py-2 text-black bg-gray-100">
            <div className="flex items-center gap-6">
                {/* Like */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={isProject ? handleLike : undefined}
                        className={`transition-colors cursor-pointer ${
                            isLiked ? "text-red-500" : "hover:text-blue-500"
                        } ${!isProject ? "cursor-default opacity-50" : ""}`}
                        aria-label="Like"
                        disabled={!isProject}
                        tabIndex={isProject ? 0 : -1}
                    >
                        <Heart
                            className="size-7"
                            fill={isLiked ? "currentColor" : "none"}
                        />
                    </button>
                    <span className="text-sm">{likes.length}</span>
                </div>

                {/* Comments */}
                <div className="flex items-center gap-1">
                    <button
                        className="hover:text-blue-500 transition-colors cursor-pointer"
                        aria-label="Comments"
                    >
                        <MessageCircle className="size-7" />
                    </button>
                    <span className="text-sm">0</span>
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-1">
                <span className="text-sm">{saves.length}</span>{" "}
                {/* Moved count to left */}
                <button
                    onClick={isProject ? handleSave : undefined}
                    className={`transition-colors cursor-pointer ${
                        isSaved ? "text-yellow-500" : "hover:text-blue-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Save"
                    disabled={!isProject}
                    tabIndex={isProject ? 0 : -1}
                >
                    <Bookmark
                        className="size-7"
                        fill={isSaved ? "currentColor" : "none"}
                    />
                </button>
            </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col items-center gap-6 text-black">
            <div className="flex flex-col items-center">
                <button
                    onClick={isProject ? handleLike : undefined}
                    className={`transition-colors cursor-pointer ${
                        isLiked ? "text-red-500" : "hover:text-blue-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Like"
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
                        isSaved ? "text-yellow-500" : "hover:text-blue-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Save"
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
    </>
);

export default HomeFeedItem;
