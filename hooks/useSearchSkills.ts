"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchSkills } from "@/actions/content/skill/searchSkills";

export function useSearchSkills(query: string) {
    return useInfiniteQuery({
        queryKey: ["searchSkills", query],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await searchSkills({ query, cursor: pageParam, limit: 10 });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        enabled: query.trim().length > 0,
        initialPageParam: undefined,
    });
}
