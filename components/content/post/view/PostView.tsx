"use client";

import { MENU, MENU_ITEM, MENU_ITEM_DANGER } from "@/lib/menuStyles";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigate } from "@/lib/navigation";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    Bookmark,
    Heart,
    MapPin,
    MessageCircle,
    MoreHorizontal,
    Share2,
    Trash2,
    Eye,
} from "lucide-react";
import VisibilityModal from "@/components/general/VisibilityModal";
import VisibilityBadge from "@/components/general/VisibilityBadge";
import { toast } from "sonner";

import { UserIcon } from "@/components/general/UserIcon";
import ConfirmModal from "@/components/general/ConfirmModal";
import { likePost } from "@/actions/content/post/likePost";
import { savePost } from "@/actions/content/post/savePost";
import { deletePost } from "@/actions/content/post/deletePost";
import type { PostPageData } from "@/actions/content/post/getPostPage";
import { markSeen } from "@/lib/seenPosts";
import { previewUrl } from "@/lib/imageUrl";
import PostCarousel from "./PostCarousel";
import Caption from "../Caption";
import CommentList from "@/components/content/comments/CommentList";
import CommentInput from "@/components/content/comments/CommentInput";

type Props = PostPageData;

const PostView = ({ post, currentUserId }: Props) => {
    const router = useRouter();
    // Shows the loading screen right away (see NavigationLoader).
    const navigate = useNavigate();
    const { author } = post;
    const isOwner = currentUserId === author.id;
    const profileHref = `/profile/${author.username}`;

    const [like, setLike] = useState({ count: post.stats.likes, active: post.stats.liked });
    const [save, setSave] = useState({ count: post.stats.saves, active: post.stats.saved });
    const [commentCount, setCommentCount] = useState(post.stats.comments);
    const changeCount = (d: number) => setCommentCount((c) => Math.max(0, c + d));
    const focusCommentBox = () =>
        document.querySelector<HTMLTextAreaElement>("[data-comment-box] textarea")?.focus();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [visibilityOpen, setVisibilityOpen] = useState(false);

    // Opening the post counts as a view (and hides it from "unseen" feeds).
    useEffect(() => {
        if (currentUserId) markSeen(post.id);
    }, [currentUserId, post.id]);

    // On the phone layout the photo box takes the first photo's shape
    // (between 3:4 tall and 16:9 wide), so there are no big empty bars.
    const [photoRatio, setPhotoRatio] = useState(4 / 5);
    const firstPhoto = post.content[0];
    useEffect(() => {
        if (!firstPhoto) return;
        const img = new Image();
        img.onload = () => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const r = img.naturalWidth / img.naturalHeight;
            setPhotoRatio(Math.min(16 / 9, Math.max(3 / 4, r)));
        };
        // Same small preview the carousel shows first, so it's usually cached.
        img.src = previewUrl(firstPhoto, 480);
    }, [firstPhoto]);

    const requireLogin = () => {
        toast.error("Sign in to like and save posts.");
        navigate("/auth/signin");
    };

    const handleLike = async () => {
        if (!currentUserId) return requireLogin();
        const previous = like;
        setLike({ count: like.count + (like.active ? -1 : 1), active: !like.active });
        const result = await likePost(post.id, currentUserId);
        if (result?.error) {
            toast.error(result.error);
            setLike(previous);
        }
    };

    const handleSave = async () => {
        if (!currentUserId) return requireLogin();
        const previous = save;
        setSave({ count: save.count + (save.active ? -1 : 1), active: !save.active });
        const result = await savePost(post.id, currentUserId);
        if (result?.error) {
            toast.error(result.error);
            setSave(previous);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: `Post by @${author.username}`, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied.");
            }
        } catch {
            // User closed the share sheet.
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deletePost(post.id);
        setIsDeleting(false);
        setConfirmDelete(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Post deleted.");
            navigate("/portfolio?section=posts");
        }
    };

    const goBack = () => {
        if (window.history.length > 1) router.back();
        else navigate(profileHref);
    };

    const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    const description = post.description ?? "";

    const authorHeader = (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href={profileHref} className="flex items-center gap-3 min-w-0">
                <UserIcon image={author.image} size="size-9" />
                <div className="min-w-0 leading-tight">
                    <p className="text-sm font-semibold truncate">{author.name}</p>
                    <p className="text-xs text-gray-500 truncate">@{author.username}</p>
                </div>
            </Link>

            {isOwner && (
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Post options"
                        className="p-1.5 rounded-md hover:bg-gray-300 cursor-pointer"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {menuOpen && (
                        <div className={`absolute right-0 top-9 z-20 w-48 ${MENU}`}>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setVisibilityOpen(true);
                                }}
                                className={MENU_ITEM}
                            >
                                <Eye className="w-4 h-4" /> Who can see this
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirmDelete(true);
                                }}
                                className={MENU_ITEM_DANGER}
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const actions = (
        <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLike}
                        aria-label={like.active ? "Unlike" : "Like"}
                        className={`transition-transform active:scale-90 cursor-pointer ${
                            like.active ? "text-red-500" : "hover:text-gray-500"
                        }`}
                    >
                        <Heart className="size-7" fill={like.active ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={focusCommentBox}
                        aria-label="Comment"
                        className="hover:text-gray-500 transition-transform active:scale-90 cursor-pointer"
                    >
                        <MessageCircle className="size-7" />
                    </button>
                    <button
                        onClick={handleShare}
                        aria-label="Share"
                        className="hover:text-gray-500 transition-transform active:scale-90 cursor-pointer"
                    >
                        <Share2 className="size-6" />
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    aria-label={save.active ? "Unsave" : "Save"}
                    className={`transition-transform active:scale-90 cursor-pointer ${
                        save.active ? "text-yellow-500" : "hover:text-gray-500"
                    }`}
                >
                    <Bookmark className="size-7" fill={save.active ? "currentColor" : "none"} />
                </button>
            </div>

            <p className="mt-2 text-sm font-semibold">
                {like.count} {like.count === 1 ? "like" : "likes"}
                <span className="font-normal text-gray-500">
                    {" "}· {post.stats.views} {post.stats.views === 1 ? "view" : "views"}
                </span>
            </p>
        </div>
    );

    const caption = (
        <div className="px-4 pb-4 space-y-2 text-sm">
            <Caption text={description} username={author.username} lines={3} />

            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {post.tags.map((tag) => (
                        <Link
                            key={tag}
                            href={`/explore?q=${encodeURIComponent(`#${tag}`)}`}
                            className="text-blue-600 hover:underline"
                        >
                            #{tag}
                        </Link>
                    ))}
                </div>
            )}

            {post.location && (
                <p className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{post.location}</span>
                </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[11px] text-gray-400">{timeAgo}</p>
                {isOwner && <VisibilityBadge kind="post" id={post.id} onClick={() => setVisibilityOpen(true)} />}
            </div>
        </div>
    );

    const commentsHeading = (
        <p className="px-4 pb-3 text-sm font-semibold text-gray-600">
            {commentCount > 0 ? `${commentCount} comment${commentCount === 1 ? "" : "s"}` : "Comments"}
        </p>
    );

    return (
        <>
            {visibilityOpen && (
                <VisibilityModal kind="post" id={post.id} onClose={() => setVisibilityOpen(false)} />
            )}

            <ConfirmModal
                isPending={isDeleting}
                open={confirmDelete}
                title="Delete this post?"
                text="This action cannot be undone. The post and its images will be permanently deleted."
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={handleDelete}
                onClose={() => setConfirmDelete(false)}
            />

            {/* Mobile top bar */}
            <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-3 h-12 bg-gray-100/95 backdrop-blur border-b">
                <button onClick={goBack} aria-label="Back" className="p-1 cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold">Post</span>
            </div>

            {/* Desktop back button */}
            <button
                onClick={goBack}
                className="hidden md:flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-black cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Side by side only on wide screens (xl). Anything smaller uses the
                phone layout, centred, so the photo never gets squished. */}
            <article className="bg-gray-100 md:max-w-[620px] md:mx-auto md:rounded-xl md:shadow-md md:overflow-hidden xl:max-w-none xl:bg-gray-200 xl:flex xl:h-[min(85vh,760px)]">
                {/* Author (mobile: above the photo) */}
                <div className="xl:hidden">{authorHeader}</div>

                {/* Photos */}
                <div
                    className="relative bg-gray-100 w-full aspect-(--post-aspect) xl:aspect-auto xl:h-full xl:flex-1 xl:min-w-0"
                    style={{ "--post-aspect": photoRatio } as React.CSSProperties}
                >
                    <PostCarousel images={post.content} />
                </div>

                {/* Side panel (desktop) / below the photo (mobile) */}
                <div className="xl:w-[340px] 2xl:w-[380px] xl:shrink-0 flex flex-col xl:border-l xl:border-gray-300">
                    <div className="hidden xl:block border-b border-gray-300">{authorHeader}</div>

                    {/* Mobile: actions right under the photo, like Instagram */}
                    <div className="xl:hidden">{actions}</div>

                    <div className="xl:flex-1 xl:overflow-y-auto xl:pt-4">
                        {caption}
                        <div className="border-t border-gray-300 pt-3">
                            {commentsHeading}
                            <CommentList
                                postId={post.id}
                                onCountChange={changeCount}
                                className="px-4 pb-4"
                            />
                        </div>
                    </div>

                    <div className="hidden xl:block border-t border-gray-300">{actions}</div>

                    {/* Comment box: bottom of the panel on desktop, stuck to the bottom on phones */}
                    <div
                        data-comment-box
                        className="sticky bottom-0 z-10 border-t border-gray-300 bg-gray-100 xl:bg-gray-200 px-4 py-1"
                    >
                        <CommentInput
                            postId={post.id}
                            currentUserId={currentUserId}
                            onCountChange={changeCount}
                        />
                    </div>
                </div>
            </article>
        </>
    );
};

export default PostView;
