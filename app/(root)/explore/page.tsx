"use client";

import { useState, useRef, useEffect } from "react";
import Subnavbar from "@/components/root/Subnavbar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const categories = [
    { key: "posts", label: "Posts" },
    { key: "projects", label: "Projects" },
    { key: "users", label: "Users" },
];

const dummySuggestions = [
    "Next.js Guide",
    "React Project",
    "User123",
    "Portfolio Website",
    "Posts about AI",
    "Cool Robotics Project",
    "Chris Chen",
];

const isIOS =
    typeof navigator !== "undefined" &&
    /iP(ad|hone|od)/.test(navigator.userAgent);

const PULL_THRESHOLD = isIOS ? 60 : 80;

export default function Page() {
    const [active, setActive] = useState("posts");
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filtered suggestions
    const filtered = search
        ? dummySuggestions.filter((s) =>
              s.toLowerCase().includes(search.toLowerCase())
          )
        : [];

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
        <div className="h-screen flex flex-col">
            {/* Sticky Search + Menu */}
            <div className="sticky top-0 z-20 bg-white shadow-sm">
                <div className="p-4 relative">
                    {/* Search with icon */}
                    <div className="relative w-full md:max-w-xl md:mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full pl-9"
                        />
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && (
                        <div className="absolute left-0 right-0 mt-1 bg-gray-100 md:rounded shadow-lg z-30 max-h-60 overflow-y-auto md:max-w-xl md:mx-auto">
                            {search && filtered.length > 0 ? (
                                filtered.map((s, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                            setSearch(s);
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        {s}
                                    </div>
                                ))
                            ) : search ? (
                                <div className="px-3 py-2 text-gray-500">
                                    No suggestions
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Subnavbar */}
                    <Subnavbar
                        categories={categories}
                        active={active}
                        setActive={setActive}
                        className="mt-3"
                    />
                </div>
            </div>

            {/* Scrollable Content with Pull-to-Refresh */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto no-scrollbar"
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
                    className="flex items-center justify-center bg-gray-200 text-gray-700 text-sm select-none"
                >
                    {isRefreshing ? (
                        <div className="animate-spin border-4 border-gray-400 border-t-gray-800 rounded-full w-6 h-6" />
                    ) : pullDistance >= PULL_THRESHOLD ? (
                        <span>Release to refresh</span>
                    ) : pullDistance > 0 ? (
                        <span>Pull to refresh</span>
                    ) : null}
                </div>

                {/* Main Content (scrolls as one) */}
                <div className="p-4">
                    {active === "posts" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                Posts
                            </h2>
                            {[...Array(20)].map((_, i) => (
                                <p
                                    key={i}
                                    className="py-2 border-b border-gray-300"
                                >
                                    Post #{i + 1}
                                </p>
                            ))}
                        </div>
                    )}

                    {active === "projects" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                Projects
                            </h2>
                            {[...Array(20)].map((_, i) => (
                                <p
                                    key={i}
                                    className="py-2 border-b border-gray-300"
                                >
                                    Project #{i + 1}
                                </p>
                            ))}
                        </div>
                    )}

                    {active === "users" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                Users
                            </h2>
                            {[...Array(20)].map((_, i) => (
                                <p
                                    key={i}
                                    className="py-2 border-b border-gray-300"
                                >
                                    User #{i + 1}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
