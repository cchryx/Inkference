"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getProfileData } from "@/actions/profile/getProfileData";
import { acceptFriendRequest } from "@/actions/users/acceptFriendRequest";
import { toggleFriendRequest } from "@/actions/users/toggleFriendRequest";
import { Skeleton } from "@/components/general/Skeleton";
import { UserIcon } from "@/components/general/UserIcon";

type Person = { userId: string; user: { name: string; username: string; image: string | null } };

/** Friend requests: ones sent to you (accept / delete) and ones you sent (cancel). */
const Requests = () => {
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState<string | null>(null);
    const { data, isLoading: loading } = useQuery({ queryKey: ["requests"], queryFn: () => getProfileData() });
    const me: string | null = data?.user.id ?? null;
    const rel = data?.relationships;
    const received = [...(rel?.friendRequestsReceived ?? []), ...(rel?.followRequestsReceived ?? [])] as Person[];
    const sent = [...(rel?.friendRequestsSent ?? []), ...(rel?.followRequestsSent ?? [])] as Person[];

    const act = async (type: "accept" | "decline" | "cancel", other: string) => {
        if (!me) return;
        setBusy(other);
        const { error } =
            type === "accept"
                ? await acceptFriendRequest(me, other)
                : type === "decline"
                  ? await toggleFriendRequest(other, me)
                  : await toggleFriendRequest(me, other);
        if (error) toast.error(error);
        else toast.success(type === "accept" ? "You're now friends." : type === "decline" ? "Request deleted." : "Request cancelled.");
        await queryClient.invalidateQueries({ queryKey: ["requests"] });
        setBusy(null);
    };

    if (loading) {
        return (
            <ul className="space-y-1">
                {[...Array(5)].map((_, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3 rounded-md" />
                            <Skeleton className="h-3 w-1/4 rounded-md" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    if (!received.length && !sent.length) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <UserPlus className="mx-auto mb-2 size-8 text-gray-400" />
                <p className="font-medium text-gray-800">No requests</p>
                <p className="text-sm">Friend requests you get or send show up here.</p>
            </div>
        );
    }

    const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50";

    return (
        <div className="space-y-4 md:space-y-6">
            {received.length > 0 && (
                <section>
                    <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:px-3">
                        Received · {received.length}
                    </h3>
                    <ul className="space-y-0.5">
                        {received.map((p) => (
                            <Row key={p.userId} p={p} note="wants to be friends">
                                <button
                                    type="button"
                                    disabled={busy === p.userId}
                                    onClick={() => act("accept", p.userId)}
                                    className={`${btn} bg-black text-white hover:bg-gray-800`}
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    disabled={busy === p.userId}
                                    onClick={() => act("decline", p.userId)}
                                    className={`${btn} bg-gray-300 text-gray-800 hover:bg-gray-400`}
                                >
                                    Delete
                                </button>
                            </Row>
                        ))}
                    </ul>
                </section>
            )}

            {sent.length > 0 && (
                <section>
                    <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:px-3">
                        Sent · {sent.length}
                    </h3>
                    <ul className="space-y-0.5">
                        {sent.map((p) => (
                            <Row key={p.userId} p={p} note="waiting">
                                <button
                                    type="button"
                                    disabled={busy === p.userId}
                                    onClick={() => act("cancel", p.userId)}
                                    className={`${btn} bg-gray-300 text-gray-800 hover:bg-gray-400`}
                                >
                                    Cancel
                                </button>
                            </Row>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

function Row({ p, children, note }: { p: Person; children: React.ReactNode; note: string }) {
    return (
        <li className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-gray-200 md:px-3">
            <Link href={`/profile/${p.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <UserIcon image={p.user.image} size="size-10 md:size-11" />
                <span className="min-w-0 text-xs leading-snug md:text-sm">
                    <span className="block truncate font-semibold">{p.user.name}</span>
                    <span className="block truncate text-gray-500">
                        @{p.user.username} · {note}
                    </span>
                </span>
            </Link>
            <div className="flex shrink-0 gap-1.5">{children}</div>
        </li>
    );
}

export default Requests;
