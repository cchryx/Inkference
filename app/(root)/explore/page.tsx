"use client";

import { useState, useRef, useEffect } from "react";
import SeeAll from "@/components/general/SeeAll";
import Subnavbar from "@/components/root/Subnavbar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
    useSearchPosts,
    useSearchProjects,
    useSearchUsers,
} from "@/hooks/useSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import UserSearchResult from "@/components/explore/UserSearchResult";
import ProjectSearchResult from "@/components/explore/ProjectSearchResult";
import PostSearchResult from "@/components/explore/PostSearchResult";
import TrendingSection from "@/components/explore/TrendingSection";
import UserCard from "@/components/content/cards/UserCard";
import ProjectCard from "@/components/content/cards/ProjectCard";
import PostPreviewCard from "@/components/content/cards/PostPreviewCard";
import Loader from "@/components/general/Loader";

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
    // ?q=... in the link (e.g. tapping a #tag) pre-fills the search.
    const searchParams = useSearchParams();
    const urlQuery = searchParams.get("q") ?? "";
    const [input, setInput] = useState(urlQuery);
    // If the link changes while you're on Explore, use the new query.
    const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
    if (urlQuery !== lastUrlQuery) {
        setLastUrlQuery(urlQuery);
        if (urlQuery) setInput(urlQuery);
    }
    // Wait until the user stops typing before searching (saves requests).
    const search = useDebouncedValue(input.trim(), 300);
    const queryClient = useQueryClient();

    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Each search only runs when its tab (or "Top") is open.
    const isTop = active === "top";
    const {
        data: usersData,
        fetchNextPage: fetchNextUsers,
        hasNextPage: hasNextUsers,
        isFetchingNextPage: isFetchingNextUsers,
        isLoading: isUsersLoading,
    } = useSearchUsers(search, isTop || active === "users");

    const {
        data: projectsData,
        fetchNextPage: fetchNextProjects,
        hasNextPage: hasNextProjects,
        isFetchingNextPage: isFetchingNextProjects,
        isLoading: isProjectsLoading,
    } = useSearchProjects(search, isTop || active === "projects");

    const {
        data: postsData,
        fetchNextPage: fetchNextPosts,
        hasNextPage: hasNextPosts,
        isFetchingNextPage: isFetchingNextPosts,
        isLoading: isPostsLoading,
    } = useSearchPosts(search, isTop || active === "posts");

    // Flatten results from infinite queries
    const users = usersData?.pages.flatMap((p) => p.users) ?? [];
    const projects = projectsData?.pages.flatMap((p) => p.projects) ?? [];
    const posts = postsData?.pages.flatMap((p) => p.posts) ?? [];
    const isTyping = input.trim() !== search;
    const topLoading =
        isTyping || isUsersLoading || isProjectsLoading || isPostsLoading;

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
                queryClient.invalidateQueries({ queryKey: ["trending"] });
                queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
                queryClient.invalidateQueries({ queryKey: ["searchProjects"] });
                queryClient.invalidateQueries({ queryKey: ["searchPosts"] });
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
    }, [isRefreshing, pullDistance, queryClient]);

    return (
        <div className="h-full flex flex-col">
            {/* Sticky Search + Menu */}
            <div className="sticky top-0 z-20 bg-white shadow-sm">
                <div className="p-4 relative">
                    {/* Search with icon */}
                    <div className="relative w-full md:max-w-xl md:mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search people, projects, posts or #tags"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
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
                    {/* Top: trending when empty, a mix of results when searching */}
                    {active === "top" && !search && !isTyping && (
                        <TrendingSection />
                    )}

                    {active === "top" && (search || isTyping) && (
                        <div className="space-y-8">
                            {topLoading &&
                                users.length + projects.length + posts.length === 0 && (
                                    <div className="flex justify-center mt-10">
                                        <Loader size={10} color="black" />
                                    </div>
                                )}

                            {!topLoading &&
                                users.length + projects.length + posts.length === 0 && (
                                    <p className="mt-10 text-center text-gray-500">
                                        No results for &ldquo;{search}&rdquo;.
                                    </p>
                                )}

                            {users.length > 0 && (
                                <TopSection title="Users" onSeeAll={() => setActive("users")}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                        {users.slice(0, 6).map((u) => (
                                            <UserCard
                                                key={u.id}
                                                id={u.id}
                                                username={u.username}
                                                name={u.name}
                                                image={u.image}
                                            />
                                        ))}
                                    </div>
                                </TopSection>
                            )}

                            {projects.length > 0 && (
                                <TopSection title="Projects" onSeeAll={() => setActive("projects")}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {projects.slice(0, 4).map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                width="w-full"
                                                height="h-[400px]"
                                            />
                                        ))}
                                    </div>
                                </TopSection>
                            )}

                            {posts.length > 0 && (
                                <TopSection title="Posts" onSeeAll={() => setActive("posts")}>
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 md:gap-4">
                                        {posts.slice(0, 10).map((post) => (
                                            <PostPreviewCard
                                                key={post.id}
                                                postId={post.id}
                                                type={post.type}
                                                content={post.data}
                                                height="aspect-square"
                                            />
                                        ))}
                                    </div>
                                </TopSection>
                            )}
                        </div>
                    )}

                    {active === "posts" && (
                        <PostSearchResult
                            posts={posts}
                            search={search}
                            isLoading={isPostsLoading || isTyping}
                            hasNextPage={!!hasNextPosts}
                            isFetchingNextPage={isFetchingNextPosts}
                            fetchNextPage={fetchNextPosts}
                        />
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
                            hasNextPage={!!hasNextUsers}
                            isFetchingNextPage={isFetchingNextUsers}
                            fetchNextPage={fetchNextUsers}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Heading + "See all" for each group in the Top tab.
function TopSection({
    title,
    onSeeAll,
    children,
}: {
    title: string;
    onSeeAll: () => void;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <SeeAll onClick={onSeeAll} />
            </div>
            {children}
        </section>
    );
}
