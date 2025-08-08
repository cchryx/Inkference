"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchForYouFeed } from "@/actions/feed/fetchForYouFeed";

export function useForYouFeed() {
    return useInfiniteQuery({
        queryKey: ["forYouFeed"],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return await fetchForYouFeed({ cursor: pageParam, limit: 10 });
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
        initialPageParam: undefined,
    });
}
