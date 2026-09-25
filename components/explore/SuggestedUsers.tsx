"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useSuggestedUsers } from "@/hooks/useSearch";
import { UserIcon } from "@/components/general/UserIcon";
import { Skeleton } from "@/components/general/Skeleton";

/** People you might know, shown before you type a search. */
const SuggestedUsers = () => {
    const { data, isLoading, isError } = useSuggestedUsers(12);

    return (
        <section className="w-full space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="h-5 w-5 text-amber-500" /> Suggested for you
            </h2>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3 rounded-md" />
                                <Skeleton className="h-3 w-1/2 rounded-md" />
                            </div>
                        </div>
                    ))}

                {data?.map((u) => (
                    <Link
                        key={u.id}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-100"
                    >
                        <UserIcon image={u.image} size="size-12" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{u.name}</p>
                            <p className="truncate text-sm text-gray-600">@{u.username}</p>
                            <p className="truncate text-xs text-gray-500">{u.reason}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {isError && <p className="text-sm text-red-600">Couldn&apos;t load suggestions.</p>}
            {!isLoading && !isError && data?.length === 0 && (
                <p className="text-sm text-gray-500">No suggestions yet. Try searching for someone.</p>
            )}
        </section>
    );
};

export default SuggestedUsers;
