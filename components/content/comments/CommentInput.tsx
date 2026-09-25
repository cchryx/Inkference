"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addComment } from "@/actions/content/comment/comments";
import { useCommentCache } from "@/hooks/useComments";

type Props = {
    postId: string;
    currentUserId: string | null;
    onCountChange?: (delta: number) => void;
    autoFocus?: boolean;
    className?: string;
};

const MAX = 1000;

const CommentInput = ({ postId, currentUserId, onCountChange, autoFocus, className = "" }: Props) => {
    const router = useRouter();
    const cache = useCommentCache(postId);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);

    if (!currentUserId) {
        return (
            <div className={`text-sm text-gray-600 ${className}`}>
                <button onClick={() => router.push("/auth/signin")} className="font-semibold text-black hover:underline cursor-pointer">
                    Sign in
                </button>{" "}
                to comment.
            </div>
        );
    }

    const submit = async () => {
        const value = text.trim();
        if (!value || sending) return;
        setSending(true);
        const { error, comment } = await addComment(postId, value);
        setSending(false);

        if (error || !comment) return toast.error(error ?? "Couldn't post comment.");
        cache.add(comment);
        onCountChange?.(1);
        setText("");
        if (ref.current) ref.current.style.height = "auto";
    };

    return (
        <form
            className={`flex items-end gap-2 ${className}`}
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <textarea
                ref={ref}
                value={text}
                autoFocus={autoFocus}
                maxLength={MAX}
                rows={1}
                placeholder="Add a comment…"
                disabled={sending}
                onChange={(e) => {
                    setText(e.target.value);
                    // Grow with the text, up to ~5 lines.
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                    // Enter sends, Shift+Enter adds a new line.
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                    }
                }}
                className="flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-500"
            />
            <button
                type="submit"
                disabled={!text.trim() || sending}
                className="py-2 text-sm font-semibold text-blue-600 disabled:text-blue-300 cursor-pointer disabled:cursor-default"
            >
                {sending ? "Posting…" : "Post"}
            </button>
        </form>
    );
};

export default CommentInput;
