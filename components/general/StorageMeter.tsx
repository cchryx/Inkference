"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { getMyStorage } from "@/actions/storage";
import { formatBytes } from "@/lib/storageConfig";

/** Small "photo storage left" bar. Links to Settings > Storage. */
export default function StorageMeter({ className = "", compact }: { className?: string; compact?: boolean }) {
    const { data } = useQuery({ queryKey: ["myStorage"], queryFn: () => getMyStorage(), staleTime: 60_000 });
    const ready = data && !("error" in data);
    const unlimited = ready && data.limit === null;
    const pct = ready && !unlimited ? Math.min(100, (data.used / data.limit!) * 100) : 0;
    const left = ready && !unlimited ? Math.max(0, data.limit! - data.used) : 0;
    const bar = pct >= 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-gray-800";

    return (
        <Link
            href="/settings?section=storage"
            title="Photo storage for your gallery, posts, projects and profile"
            className={`block rounded-md bg-gray-200 shadow-sm hover:bg-gray-300/70 transition-colors ${compact ? "px-3 py-2" : "p-3"} ${className}`}
        >
            <div className={`flex items-center justify-between gap-2 ${compact ? "text-xs" : "text-sm"}`}>
                <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className={compact ? "size-3.5" : "size-4"} /> Photo storage
                </span>
                <span className="text-xs text-gray-500 tabular-nums">
                    {!ready
                        ? "Checking..."
                        : unlimited
                          ? `${formatBytes(data.used)} used · unlimited`
                          : `${formatBytes(left)} left of ${formatBytes(data.limit!)}`}
                </span>
            </div>
            <div className={`w-full overflow-hidden rounded-full bg-gray-300 ${compact ? "mt-1.5 h-1.5" : "mt-2 h-2"}`}>
                <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
            </div>
        </Link>
    );
}
