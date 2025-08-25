"use client";

import { useState, useRef, useEffect } from "react";
import Subnavbar from "@/components/root/Subnavbar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchProjects, useSearchUsers } from "@/hooks/useSearch";
import UserSearchResult from "@/components/explore/UserSearchResult";
import ProjectSearchResult from "@/components/explore/ProjectSearchResult";

const categories = [
    { key: "top", label: "Top" },
    { key: "posts", label: "Posts" },
    { key: "projects", label: "Projects" },
    { key: "users", label: "Users" },
];

const isIOS =
    typeof navigator !== "undefined" &&
    /iP(ad|hone|od)/.test(navigator.userAgent);

const PULL_THRESHOLD = isIOS ? 60 : 80;

export default function Page() {
    const [active, setActive] = useState("top");
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 🔎 Hooks for searching users and projects
    const {
        data: usersData,
        fetchNextPage: fetchNextUsers,
        hasNextPage: hasNextUsers,
        isFetchingNextPage: isFetchingNextUsers,
        isLoading: isUsersLoading,
    } = useSearchUsers(search);

    const {
        data: projectsData,
        fetchNextPage: fetchNextProjects,
        hasNextPage: hasNextProjects,
        isFetchingNextPage: isFetchingNextProjects,
        isLoading: isProjectsLoading,
    } = useSearchProjects(search);

    // Flatten results from infinite queries
    const users = usersData?.pages.flatMap((p) => p.users) ?? [];
    const projects = projectsData?.pages.flatMap((p) => p.projects) ?? [];

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

                {/* Main Content */}
                <div className="p-4">
                    {active === "top" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Top</h2>
                            <p className="text-gray-500">
                                Top results section (coming soon)...
                            </p>
                        </div>
                    )}

                    {active === "posts" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                Posts
                            </h2>
                            <p className="text-gray-500">
                                Posts results section (coming soon)...
                            </p>
                        </div>
                    )}

                    {/* ✅ Projects tab now uses ProjectSearchResult */}
                    {active === "projects" && (
                        <ProjectSearchResult
                            active={active}
                            search={search}
                            projects={projects}
                            isProjectsLoading={isProjectsLoading}
                            hasNextPage={!!hasNextProjects}
                            isFetchingNextPage={isFetchingNextProjects}
                            fetchNextPage={fetchNextProjects}
                        />
                    )}

                    {active === "users" && (
                        <UserSearchResult
                            active={active}
                            users={users}
                            search={search}
                            isUsersLoading={isUsersLoading}
                            hasNextPage={hasNextUsers}
                            isFetchingNextPage={isFetchingNextUsers}
                            fetchNextPage={fetchNextUsers}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
