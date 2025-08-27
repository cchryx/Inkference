"use client";

import { useState, useRef, useEffect } from "react";
import ProjectCard from "../content/cards/ProjectCard";
import PostCard from "../content/cards/PostCard";
import {
    Bookmark,
    Heart,
    MessageCircle,
    Trash2,
    Pen,
    MoreVertical,
} from "lucide-react";
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

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const author = content.data?.author || content.author || null;

    // Close menu when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                menuButtonRef.current &&
                !menuButtonRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [menuOpen]);

    // Like handler
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

    // Save handler
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

    // Render content
    const contentRender = isProject ? (
        <ProjectCard
            project={content.data}
            width="lg:w-[50vh] md:w-[50vh] w-[95vw]"
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
        <div className="snap-start h-full flex flex-col w-full">
            {/* Author info (mobile top bar) */}
            {author?.username && (
                <div className="flex items-center justify-between w-full p-3 md:hidden bg-gray-100 relative">
                    {/* Left side user info */}
                    <div className="flex items-center gap-2">
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

                    {/* 3-dot menu button */}
                    <button
                        ref={menuButtonRef}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                    >
                        <MoreVertical className="size-5 text-gray-600" />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute text-sm right-4 top-12 bg-gray-200 rounded-md shadow-lg flex flex-col w-32 z-20"
                        >
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Pen className="size-4" />
                                Edit
                            </button>

                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-red-600 rounded-md"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Main content area */}
            <div className="flex w-full h-full justify-center items-center">
                <div className="flex gap-2">
                    <div>{contentRender}</div>

                    {/* Right Sidebar (desktop only) */}
                    <div className="hidden md:flex flex-col justify-between items-center">
                        {/* Top: User Icon */}
                        {author?.username && (
                            <Link href={`/profile/${author.username}`}>
                                <UserIcon
                                    image={author.image}
                                    size="size-10 bg-gray-700"
                                />
                            </Link>
                        )}

                        {/* Bottom: Action Buttons */}
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
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
                </div>
            </div>

            {/* Bottom bar (mobile only) */}
            <div className="md:hidden w-full mt-auto">
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
        <div className="flex md:hidden justify-between items-center w-full p-3 text-black bg-gray-100">
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
