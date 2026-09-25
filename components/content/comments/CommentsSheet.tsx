"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";

type Props = {
    postId: string;
    currentUserId: string | null;
    count: number;
    onClose: () => void;
    onCountChange?: (delta: number) => void;
};

/**
 * Comments popup: slides up from the bottom on phones, centred on desktop.
 */
const CommentsSheet = ({ postId, currentUserId, count, onClose, onCountChange }: Props) => {
    // Close with Escape, and stop the page behind from scrolling.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-label="Comments"
                onClick={(e) => e.stopPropagation()}
                className="flex h-[75dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl md:h-[70vh] md:w-[480px] md:rounded-xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:fade-in duration-200"
            >
                {/* Grab handle (mobile) */}
                <div className="flex justify-center pt-2 md:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" />
                </div>

                <div className="relative flex items-center justify-center border-b px-4 py-3">
                    <h2 className="font-semibold">
                        Comments{count > 0 ? ` (${count})` : ""}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-3 p-1 text-gray-500 hover:text-black cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <CommentList postId={postId} onCountChange={onCountChange} className="flex-1 overflow-y-auto px-4 py-4" />

                <div className="border-t px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
                    <CommentInput postId={postId} currentUserId={currentUserId} onCountChange={onCountChange} />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CommentsSheet;
