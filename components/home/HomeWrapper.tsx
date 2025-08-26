"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HOMETOP_LINKS } from "@/constants";
import Topbar from "../root/Topbar";
import {
    useFollowingFeed,
    useForYouFeed,
    useFriendsFeed,
} from "@/hooks/useHomeFeed";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import Loader from "../general/Loader";
import { Skeleton } from "../general/Skeleton";
import HomeFeedItem from "./HomeFeedItem";
import { useQueryClient } from "@tanstack/react-query";

type FeedKey = "for_you" | "following" | "friends";

type Props = {
    currentUserId: string;
};

const PULL_THRESHOLD = 40;

const HomeWrapper = ({ currentUserId }: Props) => {
    const queryClient = useQueryClient();

    const [active, setActive] = useState<FeedKey>("for_you");
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const feeds = {
        for_you: useForYouFeed(),
        following: useFollowingFeed(),
        friends: useFriendsFeed(),
    };

    // Pull-to-refresh touch listeners
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
                e.preventDefault();
                setPullDistance(diff > 80 ? 80 : diff);
            }
        };

        const onTouchEnd = () => {
            if (!isTouchingRef.current || isRefreshing) return;
            isTouchingRef.current = false;

            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);

                // Refresh router and refetch all feeds
                if (active === "for_you") {
                    queryClient.invalidateQueries({ queryKey: ["forYouFeed"] });
                } else if (active === "following") {
                    queryClient.invalidateQueries({
                        queryKey: ["followingFeed"],
                    });
                } else if (active === "friends") {
                    queryClient.invalidateQueries({
                        queryKey: ["friendsFeed"],
                    });
                }

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
    }, [isRefreshing, pullDistance, feeds]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, key: FeedKey) => {
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

            {(["for_you", "following", "friends"] as FeedKey[]).map((key) => {
                const {
                    data,
                    hasNextPage,
                    isFetchingNextPage,
                    isRefetching,
                    status,
                    error,
                } = feeds[key];

                const feedItems = data
                    ? data.pages.flatMap((page: any) => page.items)
                    : [];

                const showEmpty =
                    feedItems.length === 0 && status === "success";

                const isLoading =
                    status === "pending" || isRefreshing || isRefetching;

                return (
                    <div
                        key={key}
                        ref={active === key ? containerRef : null}
                        onScroll={(e) => handleScroll(e, key)}
                        tabIndex={0}
                        className={`flex-1 snap-y snap-mandatory no-scrollbar h-full overscroll-contain ${
                            isLoading
                                ? "overflow-y-hidden hidden"
                                : "overflow-y-scroll scrollable-ios"
                        }`}
                        style={{
                            display: active === key ? "block" : "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {/* Pull-to-refresh indicator — STICKY at top */}
                        <div
                            style={{
                                height: pullDistance,
                                transition: isTouchingRef.current
                                    ? "none"
                                    : "height 0.3s ease",
                            }}
                            className="sticky top-0 flex items-center justify-center bg-gray-200 text-gray-700 text-sm select-none z-10"
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
                        {isLoading && (
                            <>
                                {/* Desktop Skeleton */}
                                <div className="hidden md:flex snap-start h-full items-center justify-center">
                                    <div className="flex gap-2 w-full px-2 lg:w-auto md:gap-4">
                                        <Skeleton className="flex-1 h-[500px] lg:h-[90vh] lg:w-[500px] rounded-md" />
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

                                {/* Mobile Skeleton */}
                                <div className="flex md:hidden snap-start h-full items-center justify-center w-full">
                                    <div className="flex gap-2 w-full flex-col">
                                        <div className="flex justify-between items-center w-full px-4 py-2 bg-gray-100 rounded-md">
                                            {/* Left: User info */}
                                            <div className="flex items-center gap-3">
                                                {/* Avatar skeleton */}
                                                <Skeleton className="w-10 h-10 rounded-full" />

                                                {/* Name & username skeleton */}
                                                <div className="flex flex-col gap-1">
                                                    <Skeleton className="w-20 h-3 rounded" />
                                                    {/* Name */}
                                                    <Skeleton className="w-16 h-2 rounded" />
                                                    {/* Username */}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Image Skeleton */}
                                        <div className="px-2">
                                            <Skeleton className="w-full h-[70vh] rounded-md" />
                                        </div>
                                        {/* Bottom Bar Skeleton */}
                                        <div className="flex justify-between items-center w-full px-4 py-2 bg-gray-100 rounded-md">
                                            {/* Left actions (like + comments) */}
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center">
                                                    <Heart className="size-7 text-gray-400" />
                                                </div>

                                                <div className="flex items-center">
                                                    <MessageCircle className="size-7 text-gray-400" />
                                                </div>
                                            </div>

                                            {/* Right action (save) */}
                                            <div className="flex items-center">
                                                <Bookmark className="size-7 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Show feed content only when NOT loading */}
                        {!isLoading && (
                            <>
                                {/* Error State */}
                                {status === "error" && (
                                    <p className="p-4 text-center text-red-600">
                                        Error:{" "}
                                        {(error as Error)?.message ??
                                            "Unknown error."}
                                    </p>
                                )}

                                {/* Empty State */}
                                {showEmpty && (
                                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                        {key === "friends" && (
                                            <p>
                                                Your friends haven’t posted
                                                anything yet.
                                            </p>
                                        )}
                                        {key === "following" && (
                                            <p>
                                                People you follow haven’t posted
                                                anything yet.
                                            </p>
                                        )}
                                        {key === "for_you" && (
                                            <p>No posts found</p>
                                        )}
                                    </div>
                                )}

                                {/* Feed Items */}
                                {feedItems.map((item: any, i: number) => (
                                    <HomeFeedItem
                                        key={i}
                                        currentUserId={currentUserId}
                                        item={item}
                                    />
                                ))}

                                {/* Loading More */}
                                {isFetchingNextPage && (
                                    <div className="flex items-center justify-center w-full py-4">
                                        <Loader color="black" size={10} />
                                    </div>
                                )}

                                {/* End of Feed */}
                                {!hasNextPage && feedItems.length > 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                        That’s all for now. Maybe try scrolling
                                        up again?
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default HomeWrapper;
