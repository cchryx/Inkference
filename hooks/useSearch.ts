"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/actions/users/searchUsers";
import { searchProjects } from "@/actions/content/project/searchProjects";
import { searchPosts } from "@/actions/content/post/searchPosts";
import { getTrending, type TrendingKind, type TrendingWindow } from "@/actions/explore/getTrending";
import { recommendUsers } from "@/actions/users/recomendUsers";

// Searches only run when there's text AND the tab that needs them is open.
const canRun = (query: string, enabled: boolean) => enabled && query.trim().length > 0;

export function useSearchUsers(query: string, enabled = true) {
    return useInfiniteQuery({
        queryKey: ["searchUsers", query],
        queryFn: ({ pageParam }) => searchUsers({ query, cursor: pageParam, limit: 10 }),
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: canRun(query, enabled),
        initialPageParam: undefined as string | undefined,
        staleTime: 60_000,
    });
}

export function useSearchProjects(query: string, enabled = true) {
    return useInfiniteQuery({
        queryKey: ["searchProjects", query],
        queryFn: ({ pageParam }) => searchProjects({ query, cursor: pageParam, limit: 10 }),
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: canRun(query, enabled),
        initialPageParam: undefined as string | undefined,
        staleTime: 60_000,
    });
}

export function useSearchPosts(query: string, enabled = true) {
    return useInfiniteQuery({
        queryKey: ["searchPosts", query],
        queryFn: ({ pageParam }) => searchPosts({ query, cursor: pageParam, limit: 15 }),
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: canRun(query, enabled),
        initialPageParam: undefined as string | undefined,
        staleTime: 60_000,
    });
}

export function useTrending(window: TrendingWindow, kind: TrendingKind = "all") {
    return useQuery({
        queryKey: ["trending", window, kind],
        queryFn: () => getTrending(window, kind),
        staleTime: 5 * 60_000,
    });
}

/** "Suggested for you" people (same ranking as Recommended Accounts). */
export function useSuggestedUsers(limit = 12) {
    return useQuery({
        queryKey: ["suggestedUsers", limit],
        queryFn: async () => {
            const res = await recommendUsers(limit);
            if (res.error) throw new Error(res.error);
            return res.recommendedUsers ?? [];
        },
        staleTime: 5 * 60_000,
    });
}
