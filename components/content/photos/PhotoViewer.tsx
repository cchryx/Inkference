"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import ProgressiveImg from "@/components/general/ProgressiveImg";
import { previewUrl } from "@/lib/imageUrl";
import { formatBytes } from "@/lib/storageConfig";

type Photo = { id: string; image: string };

type Props = {
    photos: Photo[];
    index: number;
    onIndex: (i: number) => void;
    onClose: () => void;
    /** Shown to the owner: delete the photo being viewed. */
    onDelete?: (photo: Photo) => void;
    /** File size of each photo by link (shown small, owner only). */
    sizes?: Record<string, number>;
};

const SLIDE_MS = 220;

/**
 * Full-screen photo viewer. Phones: swipe left/right to browse, swipe down
 * to close. Computers: arrow buttons or arrow keys, Esc to close.
 */
export default function PhotoViewer({ photos, index, onIndex, onClose, onDelete, sizes }: Props) {
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [animating, setAnimating] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const touch = useRef<{ x: number; y: number; t: number; axis: "x" | "y" | null } | null>(null);

    const hasPrev = index > 0;
    const hasNext = index < photos.length - 1;

    // Slide over to the next/previous photo.
    const go = (dir: 1 | -1) => {
        if (animating || (dir === 1 ? !hasNext : !hasPrev)) return;
        const w = box.current?.clientWidth ?? window.innerWidth;
        setAnimating(true);
        setDx(-dir * w);
        setTimeout(() => {
            onIndex(index + dir);
            setAnimating(false);
            setDx(0);
        }, SLIDE_MS);
    };

    const snapBack = () => {
        setAnimating(true);
        setDx(0);
        setDy(0);
        setTimeout(() => setAnimating(false), SLIDE_MS);
    };

    // Keyboard, and no page scrolling behind the viewer.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowRight") go(1);
            else if (e.key === "ArrowLeft") go(-1);
        };
        window.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    });

    // Load the neighbours early so swiping is instant.
    useEffect(() => {
        for (const i of [index - 1, index + 1]) {
            const url = photos[i]?.image;
            if (!url) continue;
            new Image().src = previewUrl(url, 640);
            new Image().src = url;
        }
    }, [index, photos]);

    const onTouchStart = (e: React.TouchEvent) => {
        if (animating || e.touches.length > 1) return;
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), axis: null };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const start = touch.current;
        if (!start || e.touches.length > 1) return;
        const t = e.touches[0];
        const mx = t.clientX - start.x;
        const my = t.clientY - start.y;
        if (!start.axis) {
            if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
            start.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        }
        if (start.axis === "x") {
            // Resist at the first/last photo.
            const edge = (mx > 0 && !hasPrev) || (mx < 0 && !hasNext);
            setDx(edge ? mx / 3 : mx);
        } else {
            setDy(Math.max(0, my));
        }
    };

    const onTouchEnd = () => {
        const start = touch.current;
        touch.current = null;
        if (!start?.axis) return;
        const w = box.current?.clientWidth ?? window.innerWidth;
        const fast = Date.now() - start.t < 250;
        if (start.axis === "x") {
            const far = Math.abs(dx) > w * 0.18 || (fast && Math.abs(dx) > 30);
            if (far && dx < 0 && hasNext) go(1);
            else if (far && dx > 0 && hasPrev) go(-1);
            else snapBack();
        } else if (dy > 110 || (fast && dy > 50)) {
            onClose();
        } else {
            snapBack();
        }
    };

    const photo = photos[index];
    if (!photo) return null;
    const fade = Math.max(0.35, 1 - dy / 400);

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex flex-col select-none"
            style={{ backgroundColor: `rgba(0,0,0,${0.92 * fade})` }}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
        >
            {/* Top bar */}
            <div
                className="relative z-10 flex items-center justify-between px-3 py-2 text-white"
                style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))", opacity: fade }}
            >
                <span className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs tabular-nums">
                        {index + 1} / {photos.length}
                    </span>
                    {sizes?.[photo.image] !== undefined && (
                        <span className="text-[11px] text-white/60 tabular-nums">{formatBytes(sizes[photo.image])}</span>
                    )}
                </span>
                <div className="flex items-center gap-1">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(photo)}
                            aria-label="Delete photo"
                            className="rounded-full p-2 hover:bg-white/10 cursor-pointer"
                        >
                            <Trash2 className="size-5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 hover:bg-white/10 cursor-pointer"
                    >
                        <X className="size-6" />
                    </button>
                </div>
            </div>

            {/* Photos: previous, current and next side by side */}
            <div
                ref={box}
                className="relative flex-1 overflow-hidden touch-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={snapBack}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                {[-1, 0, 1].map((offset) => {
                    const p = photos[index + offset];
                    if (!p) return null;
                    return (
                        <div
                            key={p.id}
                            className={`absolute inset-0 p-2 sm:px-16 sm:py-4 ${animating ? "transition-transform ease-out" : ""}`}
                            style={{
                                transform: `translate3d(calc(${offset * 100}% + ${dx}px), ${offset === 0 ? dy : 0}px, 0) scale(${offset === 0 ? 1 - Math.min(dy, 300) / 1500 : 1})`,
                                transitionDuration: animating ? `${SLIDE_MS}ms` : undefined,
                            }}
                        >
                            <ProgressiveImg src={p.image} alt="Gallery photo" />
                        </div>
                    );
                })}

                {/* Arrows (computers) */}
                {hasPrev && (
                    <button
                        type="button"
                        onClick={() => go(-1)}
                        aria-label="Previous photo"
                        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:block cursor-pointer"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                )}
                {hasNext && (
                    <button
                        type="button"
                        onClick={() => go(1)}
                        aria-label="Next photo"
                        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:block cursor-pointer"
                    >
                        <ChevronRight className="size-6" />
                    </button>
                )}
            </div>

            <p
                className="py-2 text-center text-[11px] text-white/50 sm:hidden"
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", opacity: fade }}
            >
                Swipe to browse · swipe down to close
            </p>
        </div>,
        document.body
    );
}
