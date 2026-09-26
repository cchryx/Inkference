"use client";

import { formatDistanceToNow } from "date-fns";

type Props = {
    updated: string | Date | null | undefined;
    /** If given, nothing shows unless it was changed after it was made. */
    created?: string | Date | null;
    prefix?: string;
    className?: string;
};

/** Tiny grey "Updated 3 days ago". */
export default function UpdatedAgo({ updated, created, prefix = "Updated", className = "" }: Props) {
    if (!updated) return null;
    const u = new Date(updated);
    if (Number.isNaN(u.getTime())) return null;
    if (created && u.getTime() - new Date(created).getTime() < 60_000) return null; // never edited
    return (
        <span suppressHydrationWarning className={`text-[11px] text-gray-400 ${className}`} title={u.toLocaleString()}>
            {prefix} {formatDistanceToNow(u, { addSuffix: true })}
        </span>
    );
}
