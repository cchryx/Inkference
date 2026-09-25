"use client";

import { useUnreadNotifications } from "@/hooks/useNotifications";

/** Red dot (or number) for unread notifications. Renders nothing when 0. */
export function UnreadBadge({ variant = "dot", className = "" }: { variant?: "dot" | "count"; className?: string }) {
    const { data: count = 0 } = useUnreadNotifications();
    if (!count) return null;

    if (variant === "dot") {
        return (
            <span
                aria-label={`${count} unread notifications`}
                className={`h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-200 ${className}`}
            />
        );
    }

    return (
        <span
            className={`min-w-5 rounded-full bg-red-500 px-1.5 text-center text-xs font-semibold leading-5 text-white ${className}`}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}
