"use client";

import Link from "next/link";
import { UserIcon } from "@/components/general/UserIcon";

type Props = {
    id: string;
    username: string | null;
    name: string;
    image?: string | null;
};

export default function UserCard({ id, username, name, image }: Props) {
    return (
        <Link
            href={`/profile/${username}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition"
        >
            {/* Avatar */}
            <UserIcon size="size-12" image={image} />

            {/* Info */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Name on top */}
                <span className="font-semibold text-gray-900 truncate">
                    {name}
                </span>

                {/* Username below */}
                {username && (
                    <span className="text-sm text-gray-600 truncate">
                        @{username}
                    </span>
                )}
            </div>
        </Link>
    );
}
