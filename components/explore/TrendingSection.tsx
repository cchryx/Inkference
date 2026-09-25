"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Flame, Folder, Heart } from "lucide-react";
import { useTrending } from "@/hooks/useSearch";
import type { TrendingKind, TrendingWindow } from "@/actions/explore/getTrending";
import { Skeleton } from "@/components/general/Skeleton";
import { previewUrl } from "@/lib/imageUrl";

const WINDOWS: { key: TrendingWindow; label: string }[] = [
    { key: "day", label: "Today" },
    { key: "week", label: "This week" },
];

/** "Trending" grid of the hottest posts and projects. */
type Props = {
    limit?: number;
    /** Only posts or only projects (default: both). */
    kind?: TrendingKind;
    title?: string;
};

const TrendingSection = ({ limit, kind = "all", title = "Trending" }: Props) => {
    const [window, setWindow] = useState<TrendingWindow>("day");
    const { data, isLoading, isError } = useTrending(window, kind);
    const items = limit ? (data ?? []).slice(0, limit) : data ?? [];

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Flame className="w-5 h-5 text-orange-500" /> {title}
                </h2>

                <div className="flex rounded-full bg-gray-200 p-0.5 text-sm">
                    {WINDOWS.map((w) => (
                        <button
                            key={w.key}
                            onClick={() => setWindow(w.key)}
                            className={`px-3 py-1 rounded-full transition cursor-pointer ${
                                window === w.key
                                    ? "bg-white shadow-sm font-medium"
                                    : "text-gray-600 hover:text-black"
                            }`}
                        >
                            {w.label}
                        </button>
                    ))}
                </div>
            </div>

            {isError && (
                <p className="text-sm text-red-600">Couldn&apos;t load trending right now.</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                {isLoading &&
                    [...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square w-full rounded-md" />
                    ))}

                {items.map((item) => {
                    const href = item.kind === "post" ? `/post/${item.id}` : `/project/${item.id}`;
                    const hasRecent = item.recent.likes + item.recent.views > 0;
                    const likes = hasRecent ? item.recent.likes : item.counts.likes;
                    const views = hasRecent ? item.recent.views : item.counts.views;

                    return (
                        <Link
                            key={`${item.kind}-${item.id}`}
                            href={href}
                            className="group relative block aspect-square overflow-hidden rounded-md bg-gray-300 shadow-sm"
                        >
                            {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewUrl(item.image, 480)}
                                    alt={item.title}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    <Folder className="w-8 h-8" />
                                </div>
                            )}

                            {/* Type label (projects only) */}
                            {item.kind === "project" && (
                                <span className="absolute top-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                                    Project
                                </span>
                            )}

                            {/* Title + stats */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-8 text-white">
                                <p className="truncate text-sm font-medium">{item.title}</p>
                                <p className="flex items-center gap-3 text-xs text-white/85">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" /> {likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> {views}
                                    </span>
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {!isLoading && items.length === 0 && !isError && (
                <p className="text-sm text-gray-500">
                    Nothing trending yet. Like and view some posts to get it started.
                </p>
            )}
        </section>
    );
};

export default TrendingSection;
