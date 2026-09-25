"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UserIcon } from "@/components/general/UserIcon";
import Loader from "@/components/general/Loader";
import Caption from "@/components/content/post/Caption";
import { deleteComment } from "@/actions/content/comment/comments";
import { useCommentCache, useComments } from "@/hooks/useComments";
import { timeShort } from "@/lib/timeShort";

type Props = {
    postId: string;
    onCountChange?: (delta: number) => void;
    className?: string;
};

const CommentList = ({ postId, onCountChange, className = "" }: Props) => {
    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useComments(postId);
    const cache = useCommentCache(postId);
    const [deleting, setDeleting] = useState<string | null>(null);

    const comments = data?.pages.flatMap((p) => p.comments) ?? [];

    const handleDelete = async (id: string) => {
        setDeleting(id);
        const { error } = await deleteComment(id);
        setDeleting(null);
        if (error) return toast.error(error);
        cache.remove(id);
        onCountChange?.(-1);
    };

    return (
        <div className={className}>
            {isLoading && (
                <div className="flex justify-center py-6">
                    <Loader size={6} color="text-gray-500" />
                </div>
            )}

            {isError && (
                <p className="py-6 text-center text-sm text-red-600">Couldn&apos;t load comments.</p>
            )}

            {!isLoading && !isError && comments.length === 0 && (
                <div className="py-8 text-center">
                    <p className="font-semibold">No comments yet</p>
                    <p className="text-sm text-gray-500">Start the conversation.</p>
                </div>
            )}

            <ul className="space-y-4">
                {comments.map((c) => (
                    <li key={c.id} className="group flex gap-3">
                        <Link href={`/profile/${c.author.username}`} className="shrink-0">
                            <UserIcon image={c.author.image} size="size-8" />
                        </Link>

                        <div className="min-w-0 flex-1">
                            <Caption text={c.text} username={c.author.username} lines={3} />
                            <p className="mt-0.5 text-xs text-gray-500">{timeShort(c.createdAt)}</p>
                        </div>

                        {c.canDelete && (
                            <button
                                onClick={() => handleDelete(c.id)}
                                disabled={deleting === c.id}
                                aria-label="Delete comment"
                                className="self-start p-1 text-gray-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition cursor-pointer"
                            >
                                {deleting === c.id ? <Loader size={4} color="text-gray-400" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {hasNextPage && (
                <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-black cursor-pointer"
                >
                    {isFetchingNextPage ? "Loading…" : "Load more comments"}
                </button>
            )}
        </div>
    );
};

export default CommentList;
