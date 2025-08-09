"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { HOMETOP_LINKS } from "@/constants";
import Topbar from "../root/Topbar";
import {
    useFollowingFeed,
    useForYouFeed,
    useFriendsFeed,
} from "@/hooks/useForYouFeed";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import Loader from "../general/Loader";
import { Skeleton } from "../general/Skeleton";
import HomeFeedItem from "./HomeFeedItem";

type FeedKey = "for_you" | "following" | "friends";

type Props = {
    currentUserId: string;
};

const PULL_THRESHOLD = 80; // px needed to trigger refresh

const HomeWrapper = ({ currentUserId }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [active, setActive] = useState("for_you");
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const router = useRouter();

    const feeds = {
        for_you: useForYouFeed(),
        following: useFollowingFeed(),
        friends: useFriendsFeed(),
    };

    // Handle touch start - only if scrollTop is zero (top)
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isRefreshing) return;
        const target = e.currentTarget;
        if (target.scrollTop === 0) {
            isTouchingRef.current = true;
            startYRef.current = e.touches[0].clientY;
            setPullDistance(0);
        }
    };

    // Handle touch move - calculate pull distance if at top and pulling down
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isTouchingRef.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        if (startYRef.current === null) return;

        const diff = currentY - startYRef.current;

        if (diff > 0) {
            e.preventDefault(); // prevent scroll to allow pull-down effect
            // Limit pullDistance to 150 for UI
            setPullDistance(diff > 150 ? 150 : diff);
        }
    };

    // Handle touch end - if pulled far enough, trigger refresh
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isTouchingRef.current || isRefreshing) return;

        isTouchingRef.current = false;

        if (pullDistance >= PULL_THRESHOLD) {
            // Trigger refresh
            setIsRefreshing(true);
            setPullDistance(PULL_THRESHOLD); // keep indicator visible during refresh

            // Reload or refresh the router
            setIsPending(true);
            router.refresh();

            // Simulate refresh done after some delay or use effect hook to detect feed refetch
            // Here, just set timeout to clear refreshing state after 1.5s
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
                setIsPending(false);
            }, 1500);
        } else {
            // Animate indicator back to 0 if pull not enough
            setPullDistance(0);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, key: FeedKey) => {
        e.preventDefault();
        e.stopPropagation();

        const feed = feeds[key];
        if (!feed) return;

        const target = e.currentTarget;
        const isAtBottom =
            target.scrollHeight - target.scrollTop <= target.clientHeight + 10;

        if (isAtBottom && feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
        }
    };

    return (
        <>
            <Topbar
                active={active}
                setActive={setActive}
                links={HOMETOP_LINKS}
            />

            {/* Render all feeds but show only active, keep others mounted */}
            {(["for_you", "following", "friends"] as FeedKey[]).map((key) => {
                const { data, hasNextPage, isFetchingNextPage, status, error } =
                    feeds[key];

                // Flatten all pages
                const feedItems = data
                    ? data.pages.flatMap((page: any) => page.items)
                    : [];
                const feedProjects = feedItems
                    .filter((item: any) => item.type === "project")
                    .map((item: any) => ({ ...item.content }));

                // Empty state condition
                const showEmpty =
                    feedProjects.length === 0 && status === "success";

                return (
                    <div
                        key={key}
                        onScroll={(e) => handleScroll(e, key)}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`flex-1 snap-y snap-mandatory no-scrollbar h-full ${
                            status === "pending"
                                ? "overflow-y-hidden"
                                : "overflow-y-scroll"
                        }`}
                        style={{ display: active === key ? "block" : "none" }}
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

                        {/* Loading Skeleton */}
                        {(status === "pending" || isPending) && (
                            <div className="snap-start h-full flex items-center justify-center">
                                <div className="flex gap-2 w-full px-2 lg:w-auto md:gap-4">
                                    <Skeleton className="flex-1 min-h-[600px] lg:w-[500px] rounded-md" />
                                    <div className="flex flex-col items-center gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex flex-col items-center gap-4 mt-auto mb-2">
                                            {[
                                                Heart,
                                                MessageCircle,
                                                Bookmark,
                                            ].map((Icon, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col items-center"
                                                >
                                                    <Icon className="size-8" />
                                                    <Skeleton className="w-6 h-4 mt-1 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {!isPending && status === "error" && (
                            <p className="p-4 text-center text-red-600">
                                Error:{" "}
                                {(error as Error)?.message ?? "Unknown error"}
                            </p>
                        )}

                        {/* Empty State */}
                        {!isPending && showEmpty && (
                            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                {key === "friends" && (
                                    <p>
                                        Your friends haven’t posted anything
                                        yet.
                                    </p>
                                )}
                                {key === "following" && (
                                    <p>
                                        People you follow haven’t posted
                                        anything yet.
                                    </p>
                                )}
                                {key === "for_you" && <p>No projects found</p>}
                            </div>
                        )}

                        {/* Project Feed */}
                        {!isPending &&
                            feedProjects.map((project, i) => (
                                <HomeFeedItem
                                    key={i}
                                    currentUserId={currentUserId}
                                    project={project}
                                />
                            ))}

                        {/* Loading More */}
                        {!isPending && isFetchingNextPage && (
                            <div className="flex items-center justify-center w-full py-4">
                                <Loader color="black" size={10} />
                            </div>
                        )}

                        {/* End of Feed */}
                        {!isPending &&
                            !hasNextPage &&
                            feedProjects.length > 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                    That’s all for now. Maybe try scrolling up
                                    again?
                                </div>
                            )}
                    </div>
                );
            })}
        </>
    );
};

export default HomeWrapper;
