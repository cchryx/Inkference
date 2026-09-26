"use client";

import { MENU, MENU_ITEM, MENU_ITEM_DANGER } from "@/lib/menuStyles";
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
    Maximize2,
    Eye,
} from "lucide-react";
import VisibilityModal from "../general/VisibilityModal";
import CommentsSheet from "../content/comments/CommentsSheet";
import { UserIcon } from "../general/UserIcon";
import Link from "next/link";
import { toast } from "sonner";
import { likeProject } from "@/actions/content/project/likeProject";
import { saveProject } from "@/actions/content/project/saveProject";
import { likePost } from "@/actions/content/post/likePost";
import { savePost } from "@/actions/content/post/savePost";
import { deletePost } from "@/actions/content/post/deletePost";
import ConfirmModal from "../general/ConfirmModal";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { markSeen } from "@/lib/seenPosts";

type Props = {
    item: any;
    currentUserId: string;
};

const HomeFeedItem = ({ item, currentUserId }: Props) => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const isProject = item.type === "project";
    const isPost = item.type === "post";
    const content = item.content;
    const isOwner = currentUserId === content.userData.user.id;

    // Counts + "did I like/save it" come from the server (content.stats),
    // instead of the full list of everyone who liked the post.
    const [like, setLike] = useState({
        count: content.stats?.likes ?? 0,
        active: content.stats?.liked ?? false,
    });
    const [save, setSave] = useState({
        count: content.stats?.saves ?? 0,
        active: content.stats?.saved ?? false,
    });

    // Mark the post as seen once it's been on screen for 1 second.
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = rootRef.current;
        const postId: string | undefined = content.id;
        if (!el || !postId || content.seen) return;

        let timeout: ReturnType<typeof setTimeout> | undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timeout = setTimeout(() => {
                        markSeen(postId);
                        observer.disconnect();
                    }, 1000);
                } else {
                    clearTimeout(timeout);
                }
            },
            { threshold: 0.6 }
        );

        observer.observe(el);
        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [content.id, content.seen]);

    const [commentCount, setCommentCount] = useState<number>(content.stats?.comments ?? 0);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [visibilityOpen, setVisibilityOpen] = useState(false);
    // Full page for this item: projects have their own page, posts open /post/[id].
    const href = isProject && content.data?.id ? `/project/${content.data.id}` : `/post/${content.id}`;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const author = content.data?.author || content.author || null;

    // ✅ confirm modal states
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

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

        const previous = like;
        setLike({
            count: like.count + (like.active ? -1 : 1),
            active: !like.active,
        });

        let result;
        if (isProject)
            result = await likeProject(content.data.id, currentUserId);
        if (isPost) result = await likePost(content.id, currentUserId);

        if (result?.error) {
            toast.error(result.error);
            setLike(previous); // revert
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

        const previous = save;
        setSave({
            count: save.count + (save.active ? -1 : 1),
            active: !save.active,
        });

        let result;
        if (isProject)
            result = await saveProject(content.data.id, currentUserId);
        if (isPost) result = await savePost(content.id, currentUserId);

        if (result?.error) {
            toast.error(result.error);
            setSave(previous); // revert
        }
    };

    const isLiked = (isProject || isPost) && like.active;
    const isSaved = (isProject || isPost) && save.active;

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
        <div ref={rootRef} className="snap-start h-full flex flex-col w-full">
            {/* Author info (mobile top bar) */}
            {author?.username && (
                <div className="flex items-center justify-between w-full px-3 py-2 md:hidden bg-gray-100 relative">
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
                    {isOwner && (
                        <button
                            ref={menuButtonRef}
                            className={`p-1 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors ${
                                menuOpen ? "bg-gray-200" : ""
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                            aria-label="Menu"
                            aria-expanded={menuOpen}
                        >
                            <MoreVertical className="size-6" />
                        </button>
                    )}

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div
                            ref={menuRef}
                            className={`absolute right-4 top-12 z-20 flex w-36 flex-col ${MENU}`}
                        >
                            <button
                                className={MENU_ITEM}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Pen className="size-4" />
                                Edit
                            </button>

                            <button
                                className={MENU_ITEM}
                                onClick={() => {
                                    setVisibilityOpen(true);
                                    setMenuOpen(false);
                                }}
                            >
                                <Eye className="size-4" />
                                Visibility
                            </button>

                            <button
                                className={MENU_ITEM_DANGER}
                                onClick={() => {
                                    setConfirmDeleteOpen(true);
                                    setMenuOpen(false);
                                }}
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
                                likes={like.count}
                                isSaved={isSaved}
                                saves={save.count}
                                handleLike={handleLike}
                                handleSave={handleSave}
                                commentCount={commentCount}
                                onComment={() => setCommentsOpen(true)}
                                views={content.stats?.views ?? 0}
                                href={href}
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
                    likes={like.count}
                    isSaved={isSaved}
                    saves={save.count}
                    handleLike={handleLike}
                    handleSave={handleSave}
                    commentCount={commentCount}
                    onComment={() => setCommentsOpen(true)}
                    views={content.stats?.views ?? 0}
                    href={href}
                />
            </div>

            {visibilityOpen && (
                <VisibilityModal
                    kind={isProject && content.data?.id ? "project" : "post"}
                    id={isProject && content.data?.id ? content.data.id : content.id}
                    onClose={() => setVisibilityOpen(false)}
                />
            )}

            {commentsOpen && (
                <CommentsSheet
                    postId={content.id}
                    currentUserId={currentUserId}
                    count={commentCount}
                    onClose={() => setCommentsOpen(false)}
                    onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
                />
            )}

            {/* ✅ Confirm Delete Modal */}
            <ConfirmModal
                isPending={isPending}
                open={confirmDeleteOpen}
                title="Delete this post?"
                text="This action cannot be undone. The post and its images will be permanently deleted."
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={async () => {
                    setIsPending(true);
                    const result = await deletePost(content.id);
                    setIsPending(false);

                    if (result?.error) {
                        toast.error(result.error);
                    } else {
                        toast.success("Post deleted successfully.");
                        queryClient.invalidateQueries({
                            queryKey: ["forYouFeed"],
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["followingFeed"],
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["friendsFeed"],
                        });
                    }

                    setConfirmDeleteOpen(false);
                }}
                onClose={() => setConfirmDeleteOpen(false)}
            />
        </div>
    );
};

// Short numbers: 1234 -> 1.2K
const compact = (n: number) =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

const ActionButtons = ({
    isProject,
    isLiked,
    likes,
    isSaved,
    saves,
    handleLike,
    handleSave,
    commentCount,
    onComment,
    views,
    href,
}: any) => (
    <>
        {/* Mobile bottom bar: compact row */}
        <div className="flex md:hidden items-center justify-between w-full px-3 py-2 text-black bg-gray-100">
            <div className="flex items-center gap-4">
                <button
                    onClick={isProject ? handleLike : undefined}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                        isLiked ? "text-red-500" : "active:text-gray-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Like"
                    disabled={!isProject}
                    tabIndex={isProject ? 0 : -1}
                >
                    <Heart className="size-[22px]" fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-xs font-medium text-black">{compact(likes)}</span>
                </button>

                <button
                    onClick={onComment}
                    className="flex items-center gap-1 active:text-gray-500 transition-colors cursor-pointer"
                    aria-label="Comments"
                >
                    <MessageCircle className="size-[22px]" />
                    <span className="text-xs font-medium">{compact(commentCount)}</span>
                </button>

                <span className="flex items-center gap-1 text-gray-500" title="Views">
                    <Eye className="size-5" />
                    <span className="text-xs">{compact(views)}</span>
                </span>

                <Link href={href} aria-label="Open post" className="active:text-gray-500 transition-colors">
                    <Maximize2 className="size-5" />
                </Link>
            </div>

            <button
                onClick={isProject ? handleSave : undefined}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    isSaved ? "text-yellow-500" : "active:text-gray-500"
                } ${!isProject ? "cursor-default opacity-50" : ""}`}
                aria-label="Save"
                disabled={!isProject}
                tabIndex={isProject ? 0 : -1}
            >
                <span className="text-xs font-medium text-black">{compact(saves)}</span>
                <Bookmark className="size-[22px]" fill={isSaved ? "currentColor" : "none"} />
            </button>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col items-center gap-5 text-black">
            <div className="flex flex-col items-center">
                <button
                    onClick={isProject ? handleLike : undefined}
                    className={`transition-colors cursor-pointer ${
                        isLiked ? "text-red-500" : "hover:text-gray-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Like"
                    disabled={!isProject}
                    tabIndex={isProject ? 0 : -1}
                >
                    <Heart className="size-7" fill={isLiked ? "currentColor" : "none"} />
                </button>
                <span className="text-xs font-medium mt-1">{compact(likes)}</span>
            </div>

            <div className="flex flex-col items-center">
                <button
                    onClick={onComment}
                    className="hover:text-gray-500 transition-colors cursor-pointer"
                    aria-label="Comments"
                >
                    <MessageCircle className="size-7" />
                </button>
                <span className="text-xs font-medium mt-1">{compact(commentCount)}</span>
            </div>

            <div className="flex flex-col items-center">
                <button
                    onClick={isProject ? handleSave : undefined}
                    className={`transition-colors cursor-pointer ${
                        isSaved ? "text-yellow-500" : "hover:text-gray-500"
                    } ${!isProject ? "cursor-default opacity-50" : ""}`}
                    aria-label="Save"
                    disabled={!isProject}
                    tabIndex={isProject ? 0 : -1}
                >
                    <Bookmark className="size-7" fill={isSaved ? "currentColor" : "none"} />
                </button>
                <span className="text-xs font-medium mt-1">{compact(saves)}</span>
            </div>

            <div className="flex flex-col items-center text-gray-500" title="Views">
                <Eye className="size-6" />
                <span className="text-xs mt-1">{compact(views)}</span>
            </div>

            {/* Open the full post page */}
            <Link
                href={href}
                aria-label="Open post"
                title="Open post"
                className="flex flex-col items-center hover:text-gray-500 transition-colors"
            >
                <Maximize2 className="size-6" />
                <span className="text-[11px] mt-1">Open</span>
            </Link>
        </div>
    </>
);

export default HomeFeedItem;
