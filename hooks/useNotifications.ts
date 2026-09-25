"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getNotifications, getUnreadCount } from "@/actions/notifications/notifications";

export const UNREAD_KEY = ["unreadNotifications"];

/** Unread count for the badge. Checks every minute and when you come back to the tab. */
export function useUnreadNotifications(enabled = true) {
    return useQuery({
        queryKey: UNREAD_KEY,
        queryFn: () => getUnreadCount(),
        enabled,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
        staleTime: 30_000,
    });
}

export function useNotificationsList() {
    return useInfiniteQuery({
        queryKey: ["notifications"],
        queryFn: ({ pageParam }) => getNotifications(pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor,
        staleTime: 0,
        refetchOnMount: "always",
    });
}
