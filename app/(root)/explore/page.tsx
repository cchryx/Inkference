"use client";

import { useState, useRef, useEffect } from "react";

const isIOS =
    typeof navigator !== "undefined" &&
    /iP(ad|hone|od)/.test(navigator.userAgent);

const PULL_THRESHOLD = isIOS ? 60 : 80;

export default function Page() {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onTouchStart = (e: TouchEvent) => {
            if (isRefreshing) return;
            if (el.scrollTop <= 0) {
                isTouchingRef.current = true;
                startYRef.current = e.touches[0].clientY;
                setPullDistance(0);
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isTouchingRef.current || isRefreshing) return;
            if (startYRef.current === null) return;

            const diff = e.touches[0].clientY - startYRef.current;
            if (diff > 0) {
                e.preventDefault(); // block Safari native refresh
                setPullDistance(diff > 150 ? 150 : diff);
            }
        };

        const onTouchEnd = () => {
            if (!isTouchingRef.current || isRefreshing) return;
            isTouchingRef.current = false;

            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);
                // Simulate refresh delay
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 1500);
            } else {
                setPullDistance(0);
            }
        };

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd, { passive: true });

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [isRefreshing, pullDistance]);

    return (
        <div
            ref={containerRef}
            className="h-screen overflow-y-scroll bg-gray-100"
            style={{ WebkitOverflowScrolling: "touch" }}
        >
            {/* Pull-to-refresh indicator */}
            <div
                style={{
                    height: pullDistance,
                    transition: isTouchingRef.current
                        ? "none"
                        : "height 0.3s ease",
                }}
                className="flex items-center justify-center bg-gray-300 text-gray-700 text-sm select-none"
            >
                {isRefreshing ? (
                    <div className="animate-spin border-4 border-gray-400 border-t-gray-800 rounded-full w-6 h-6" />
                ) : pullDistance >= PULL_THRESHOLD ? (
                    <span>Release to refresh</span>
                ) : pullDistance > 0 ? (
                    <span>Pull to refresh</span>
                ) : null}
            </div>

            {/* Content to scroll */}
            <div style={{ height: 1500, padding: 20 }}>
                <h1 className="text-2xl font-bold mb-4">
                    Pull-to-Refresh Test
                </h1>
                {[...Array(30)].map((_, i) => (
                    <p key={i} className="py-2 border-b border-gray-300">
                        Item #{i + 1}
                    </p>
                ))}
            </div>
        </div>
    );
}
