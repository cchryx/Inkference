"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchHomeFeed, type FeedType } from "@/actions/feed/fetchHomeFeed";

const PAGE_SIZE = 10;

function useFeed(queryKey: string, feedType: FeedType) {
    return useInfiniteQuery({
        queryKey: [queryKey],
        queryFn: ({ pageParam }) =>
            fetchHomeFeed({ cursor: pageParam, limit: PAGE_SIZE, feedType }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // Don't silently reload old pages: what counts as "seen" changes while
        // scrolling, so a reload would shuffle posts under the user's finger.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export const useForYouFeed = () => useFeed("forYouFeed", "foryou");
export const useFollowingFeed = () => useFeed("followingFeed", "following");
export const useFriendsFeed = () => useFeed("friendsFeed", "friends");
