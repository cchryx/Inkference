"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchUsers } from "@/actions/users/searchUsers";
import { searchProjects } from "@/actions/content/project/searchProjects";

export function useSearchUsers(query: string) {
    return useInfiniteQuery({
        queryKey: ["searchUsers", query],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await searchUsers({ query, cursor: pageParam, limit: 10 });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: query.trim().length > 0,
        initialPageParam: undefined,
    });
}

export function useSearchProjects(query: string) {
    return useInfiniteQuery({
        queryKey: ["searchProjects", query],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await searchProjects({
                query,
                cursor: pageParam,
                limit: 10,
            });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: query.trim().length > 0,
        initialPageParam: undefined,
    });
}
