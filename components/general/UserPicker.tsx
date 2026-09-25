"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { searchUsers } from "@/actions/users/searchUsers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { UserIcon } from "./UserIcon";

export type PickedUser = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
};

type Props = {
    value: PickedUser[];
    onChange: (users: PickedUser[]) => void;
    placeholder?: string;
    disabled?: boolean;
    excludeIds?: string[];
};

/** Search people by name/username and pick several. */
const UserPicker = ({ value, onChange, placeholder = "Search people…", disabled, excludeIds = [] }: Props) => {
    const [text, setText] = useState("");
    const query = useDebouncedValue(text.trim(), 250);

    const { data, isFetching } = useQuery({
        queryKey: ["userPicker", query],
        queryFn: () => searchUsers({ query, limit: 8 }),
        enabled: query.length > 0,
        staleTime: 60_000,
    });

    const chosen = new Set([...value.map((u) => u.id), ...excludeIds]);
    const results = (data?.users ?? []).filter((u) => !chosen.has(u.id));

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((u) => (
                        <span
                            key={u.id}
                            className="flex items-center gap-1.5 rounded-full bg-gray-200 py-0.5 pl-1 pr-2 text-sm"
                        >
                            <UserIcon image={u.image} size="size-5" />
                            <span className="max-w-[10rem] truncate">@{u.username ?? u.name}</span>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => onChange(value.filter((x) => x.id !== u.id))}
                                aria-label={`Remove ${u.name}`}
                                className="text-gray-500 hover:text-black cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    value={text}
                    disabled={disabled}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-gray-500"
                />
            </div>

            {query && (
                <ul className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white">
                    {isFetching && results.length === 0 && (
                        <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
                    )}
                    {!isFetching && results.length === 0 && (
                        <li className="px-3 py-2 text-sm text-gray-500">No one found.</li>
                    )}
                    {results.map((u) => (
                        <li key={u.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange([...value, u]);
                                    setText("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                            >
                                <UserIcon image={u.image} size="size-7" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium">{u.name}</span>
                                    <span className="block truncate text-xs text-gray-500">@{u.username}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserPicker;
