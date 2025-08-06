"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { UserIcon } from "@/components/general/UserIcon";

type FriendsWrapperProps = {
    friendsList?: any[];
};

const FriendsWrapper = ({ friendsList = [] }: FriendsWrapperProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const observerRef = useRef<HTMLDivElement | null>(null);

    const filteredFriends = useMemo(() => {
        return friendsList.filter((friend) => {
            const { name, username } = friend.user;
            return (
                name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                username.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [searchQuery, friendsList]);

    const getCategorizedFriends = () => {
        const grouped = filteredFriends.reduce(
            (acc: Record<string, any[]>, friend) => {
                const firstLetter = friend.user.name[0].toUpperCase();
                if (!acc[firstLetter]) acc[firstLetter] = [];
                acc[firstLetter].push(friend);
                return acc;
            },
            {}
        );
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    };

    const isEmpty = filteredFriends.length === 0;

    return (
        <div className="relative w-full h-full md:w-3xl p-4 flex flex-col items-center overflow-hidden space-y-3 select-none">
            {/* Search Bar */}
            <div className="w-full pb-1">
                <Input
                    type="text"
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-md"
                />
            </div>

            {/* Friends List */}
            {isEmpty ? (
                <div className="text-gray-500">No friends found.</div>
            ) : (
                <div className="w-full overflow-y-auto flex flex-col gap-3 no-scrollbar">
                    {getCategorizedFriends().map(([letter, friends]) => (
                        <div key={letter}>
                            <h2 className="sticky top-0 text-sm font-semibold text-gray-500 py-1 z-10 bg-white">
                                {letter}
                            </h2>
                            <div className="rounded-lg bg-gray-100">
                                {friends.map((friend) => (
                                    <div key={friend.userId}>
                                        <Link
                                            href={`/profile/${friend.user.username}`}
                                            className="flex gap-3 items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-200 cursor-pointer"
                                        >
                                            <UserIcon
                                                image={friend.user.image}
                                                size="size-10"
                                            />
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-800">
                                                    {friend.user.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    @{friend.user.username}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div ref={observerRef} className="h-0" />
        </div>
    );
};

export default FriendsWrapper;
