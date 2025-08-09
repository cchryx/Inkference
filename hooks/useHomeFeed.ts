"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchHomeFeed } from "@/actions/feed/fetchHomeFeed";

export function useForYouFeed() {
    return useInfiniteQuery({
        queryKey: ["forYouFeed"],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await fetchHomeFeed({ cursor: pageParam, limit: 10 });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        initialPageParam: undefined,
    });
}

export function useFollowingFeed() {
    return useInfiniteQuery({
        queryKey: ["followingFeed"],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await fetchHomeFeed({
                cursor: pageParam,
                limit: 10,
                feedType: "following",
            });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        initialPageParam: undefined,
    });
}

export function useFriendsFeed() {
    return useInfiniteQuery({
        queryKey: ["friendsFeed"],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await fetchHomeFeed({
                cursor: pageParam,
                limit: 10,
                feedType: "friends",
            });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        initialPageParam: undefined,
    });
}
