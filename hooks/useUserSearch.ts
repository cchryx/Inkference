"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchUsers } from "@/actions/users/searchUsers";

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
