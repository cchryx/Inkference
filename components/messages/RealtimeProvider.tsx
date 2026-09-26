"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserIcon } from "@/components/general/UserIcon";
import { getMessageCounts } from "@/actions/messages";
import type { RealtimeEvent } from "@/lib/realtime";

// One live connection per tab. The server pushes chat events down it the
// moment they happen, so messages show up instantly (no refreshing, no polling).

export type ClientEvent = RealtimeEvent | { type: "resync" };
type Handler = (e: ClientEvent) => void;

const Ctx = createContext<{ subscribe: (fn: Handler) => () => void } | null>(null);

const EVENT_TYPES = ["message", "unsent", "read", "typing", "conversation"] as const;
export const COUNTS_KEY = ["messageCounts"];

/** Little pop-up for a new message, unless you're looking at that chat or muted it. */
function popup(e: RealtimeEvent, userId: string, open: (url: string) => void) {
    if (e.type !== "message" || !e.alert || e.alert.muted) return;
    const m = e.message;
    if (m.kind !== "text" || !m.senderId || m.senderId === userId) return;
    if (document.visibilityState !== "visible") return;
    const onChat =
        window.location.pathname === "/social/messages" &&
        new URLSearchParams(window.location.search).get("c") === e.conversationId;
    if (onChat) return;

    const a = e.alert;
    const url = `/social/messages?${a.request ? "tab=requests&" : ""}c=${e.conversationId}`;
    const text = m.text.length > 90 ? `${m.text.slice(0, 89)}…` : m.text;
    toast(a.request ? `Message request from ${a.from}` : a.group ? `${a.from} in ${a.group}` : a.from, {
        id: `chat:${e.conversationId}`, // a new one replaces the old one for the same chat
        description: text,
        icon: <UserIcon image={a.image} size="size-6" />,
        action: { label: "Open", onClick: () => open(url) },
        duration: 5000,
    });
}

export default function RealtimeProvider({ userId, children }: { userId: string; children: ReactNode }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const routerRef = useRef(router);
    useEffect(() => {
        routerRef.current = router;
    }, [router]);
    const [handlers] = useState(() => new Set<Handler>());
    const value = useMemo(
        () => ({
            subscribe: (fn: Handler) => {
                handlers.add(fn);
                return () => {
                    handlers.delete(fn);
                };
            },
        }),
        [handlers]
    );

    useEffect(() => {
        let es: EventSource | null = null;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let countsTimer: ReturnType<typeof setTimeout> | undefined;
        let delay = 2000;
        let connectedBefore = false;
        let stopped = false;

        const emit = (e: ClientEvent) => {
            for (const h of handlers) {
                try {
                    h(e);
                } catch (err) {
                    console.error(err);
                }
            }
        };
        // Badge refresh, bunched up so a busy group chat doesn't spam the server.
        const refreshCounts = () => {
            clearTimeout(countsTimer);
            countsTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: COUNTS_KEY }), 700);
        };

        const open = () => {
            if (stopped || es) return;
            const source = new EventSource("/api/realtime");
            es = source;
            source.addEventListener("ready", () => {
                delay = 2000;
                // Reconnected after a drop: catch up on anything we missed.
                if (connectedBefore) {
                    emit({ type: "resync" });
                    refreshCounts();
                }
                connectedBefore = true;
            });
            for (const type of EVENT_TYPES) {
                source.addEventListener(type, (ev) => {
                    let data: RealtimeEvent;
                    try {
                        data = JSON.parse((ev as MessageEvent).data);
                    } catch {
                        return;
                    }
                    emit(data);
                    popup(data, userId, (url) => routerRef.current.push(url));
                    if (
                        data.type === "message" ||
                        data.type === "conversation" ||
                        data.type === "unsent" ||
                        (data.type === "read" && data.userId === userId)
                    ) {
                        refreshCounts();
                    }
                });
            }
            source.onerror = () => {
                // The browser retries by itself while CONNECTING. CLOSED means it gave up.
                if (source.readyState === EventSource.CLOSED) {
                    source.close();
                    if (es === source) es = null;
                    clearTimeout(retry);
                    retry = setTimeout(open, delay);
                    delay = Math.min(delay * 2, 60_000);
                }
            };
        };

        open();

        // Phone woke up / wifi came back: reconnect right away.
        const wake = () => {
            if (document.visibilityState !== "visible") return;
            if (es && es.readyState === EventSource.CLOSED) {
                es.close();
                es = null;
            }
            if (!es) {
                clearTimeout(retry);
                delay = 2000;
                open();
            }
        };
        document.addEventListener("visibilitychange", wake);
        window.addEventListener("online", wake);

        return () => {
            stopped = true;
            clearTimeout(retry);
            clearTimeout(countsTimer);
            es?.close();
            es = null;
            document.removeEventListener("visibilitychange", wake);
            window.removeEventListener("online", wake);
        };
    }, [handlers, queryClient, userId]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Run `handler` for every live chat event (always sees the latest handler). */
export function useRealtime(handler: Handler) {
    const ctx = useContext(Ctx);
    const ref = useRef(handler);
    useEffect(() => {
        ref.current = handler;
    });
    useEffect(() => {
        if (!ctx) return;
        return ctx.subscribe((e) => ref.current(e));
    }, [ctx]);
}

/** Unread chats + waiting requests (for the red badges). */
export function useMessageCounts(enabled = true) {
    return useQuery({
        queryKey: COUNTS_KEY,
        queryFn: () => getMessageCounts(),
        enabled,
        staleTime: 15_000,
        refetchInterval: 120_000,
        refetchOnWindowFocus: true,
    });
}

/** Red dot or number for unread messages. Renders nothing when 0. */
export function MessagesBadge({ variant = "dot", className = "" }: { variant?: "dot" | "count"; className?: string }) {
    const { data } = useMessageCounts();
    const n = (data?.chats ?? 0) + (data?.requests ?? 0);
    if (!n) return null;
    if (variant === "dot") {
        return <span aria-label={`${n} unread chats`} className={`h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-200 ${className}`} />;
    }
    return (
        <span className={`min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white ${className}`}>
            {n > 99 ? "99+" : n}
        </span>
    );
}
