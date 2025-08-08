"use client";

import { useState } from "react";
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

const HomeWrapper = ({ currentUserId }: Props) => {
    const [active, setActive] = useState("for_you");

    const feeds = {
        for_you: useForYouFeed(),
        following: useFollowingFeed(),
        friends: useFriendsFeed(),
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
                        className={`flex-1 snap-y snap-mandatory no-scrollbar h-full ${
                            status === "pending"
                                ? "overflow-y-hidden"
                                : "overflow-y-scroll"
                        }`}
                        style={{ display: active === key ? "block" : "none" }}
                    >
                        {/* Loading Skeleton */}
                        {status === "pending" && (
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
                        {status === "error" && (
                            <p className="p-4 text-center text-red-600">
                                Error:{" "}
                                {(error as Error)?.message ?? "Unknown error"}
                            </p>
                        )}

                        {/* Empty State */}
                        {showEmpty && (
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
                        {feedProjects.map((project, i) => (
                            <HomeFeedItem
                                key={i}
                                currentUserId={currentUserId}
                                project={project}
                            />
                        ))}

                        {/* Loading More */}
                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center w-full py-4">
                                <Loader color="black" size={10} />
                            </div>
                        )}

                        {/* End of Feed */}
                        {!hasNextPage && feedProjects.length > 0 && (
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
