"use client";

import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { useMessageCounts } from "@/components/messages/RealtimeProvider";

/** Shortcut at the top of Inbox > Requests to your message requests. */
export default function MessageRequestsRow() {
    const { data } = useMessageCounts();
    const n = data?.requests ?? 0;
    return (
        <Link
            href="/social/messages?tab=requests"
            className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5 transition hover:bg-gray-200"
        >
            <span className="grid size-10 place-items-center rounded-full bg-blue-600 text-white">
                <MessageCircle className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Message requests</span>
                <span className="block text-xs text-gray-500">
                    {n ? `${n} new request${n === 1 ? "" : "s"}` : "People who aren't your friends message you here first"}
                </span>
            </span>
            {n > 0 && (
                <span className="min-w-5 rounded-full bg-red-500 px-1.5 text-center text-xs font-semibold leading-5 text-white">{n}</span>
            )}
            <ChevronRight className="size-4 text-gray-400" />
        </Link>
    );
}
