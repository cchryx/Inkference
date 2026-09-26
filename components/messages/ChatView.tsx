"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { Bell, BellOff, ChevronLeft, Info, RotateCcw, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import ConfirmModal from "@/components/general/ConfirmModal";
import { UserIcon } from "@/components/general/UserIcon";
import { blockUser } from "@/actions/users/blockUser";
import {
    acceptRequest,
    deleteRequest,
    getConversation,
    getMessages,
    markRead,
    sendMessage,
    sendTyping,
    setMuted,
    unsendMessage,
    type ConversationDetail,
    type ConversationSummary,
} from "@/actions/messages";
import type { MessageDTO } from "@/lib/realtime";
import { useRealtime } from "./RealtimeProvider";
import ChatInfo from "./ChatInfo";
import { ChatAvatar, Linkified, clock, needsStamp, stampLabel } from "./chatUtils";

type Page = { messages: MessageDTO[]; hasMore: boolean };
type Pages = InfiniteData<Page, string | undefined>;
type Pending = { clientId: string; text: string; createdAt: string; failed?: boolean };
type Item = {
    key: string;
    id: string | null;
    senderId: string | null;
    kind: string;
    text: string;
    createdAt: string;
    deleted: boolean;
    pending?: Pending;
};

const MAX_TEXT = 4000;

// ---- cache helpers (the chat's messages live in react-query, newest first) ----

function insertMessage(qc: QueryClient, id: string, m: MessageDTO) {
    qc.setQueryData<Pages>(["messages", id], (old) => {
        if (!old?.pages.length) return old;
        if (old.pages.some((p) => p.messages.some((x) => x.id === m.id))) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, messages: [m, ...first.messages] }, ...rest] };
    });
}

function markUnsent(qc: QueryClient, id: string, messageId: string) {
    qc.setQueryData<Pages>(["messages", id], (old) =>
        old
            ? {
                  ...old,
                  pages: old.pages.map((p) => ({
                      ...p,
                      messages: p.messages.map((x) => (x.id === messageId ? { ...x, deleted: true, text: "" } : x)),
                  })),
              }
            : old
    );
}

function bumpList(qc: QueryClient, id: string, m: MessageDTO) {
    qc.setQueryData<ConversationSummary[]>(["conversations", "inbox"], (list) => {
        const c = list?.find((x) => x.id === id);
        if (!list || !c) return list;
        const next = {
            ...c,
            last: { text: m.text.slice(0, 120), senderId: m.senderId, kind: m.kind, deleted: false, createdAt: m.createdAt },
            lastMessageAt: m.createdAt,
            unread: 0,
        };
        return [next, ...list.filter((x) => x.id !== id)];
    });
}

const newClientId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

type Props = {
    id: string;
    meId: string;
    now: number;
    onBack: () => void;
    onGone: () => void;
    onAccepted: () => void;
};

export default function ChatView({ id, meId, now, onBack, onGone, onAccepted }: Props) {
    const qc = useQueryClient();
    const detailQ = useQuery({
        queryKey: ["conversation", id],
        queryFn: () => getConversation(id),
        staleTime: 0,
        refetchOnMount: "always",
    });
    const msgsQ = useInfiniteQuery({
        queryKey: ["messages", id],
        queryFn: ({ pageParam }) => getMessages(id, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => (last.hasMore ? last.messages[last.messages.length - 1]?.id : undefined),
        staleTime: 0,
        refetchOnMount: "always",
    });
    const detail = detailQ.data;

    const [text, setText] = useState("");
    const [pending, setPending] = useState<Pending[]>([]);
    const [typing, setTyping] = useState<Record<string, string>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);
    const [busy, setBusy] = useState<"accept" | "delete" | "block" | null>(null);
    const [confirmBlock, setConfirmBlock] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const readTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastTypingSent = useRef(0);

    const others = useMemo(() => (detail?.members ?? []).filter((m) => m.id !== meId), [detail, meId]);
    const other = !detail?.isGroup ? others[0] : undefined;

    // ---------- Seen ----------
    const scheduleRead = useCallback(() => {
        clearTimeout(readTimer.current);
        readTimer.current = setTimeout(() => {
            if (document.visibilityState !== "visible") return;
            const d = qc.getQueryData<ConversationDetail | null>(["conversation", id]);
            // Requests stay "unseen" until you accept.
            if (!d || d.myStatus !== "active") return;
            qc.setQueryData<ConversationSummary[]>(["conversations", "inbox"], (l) =>
                l?.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
            );
            void markRead(id);
        }, 300);
    }, [id, qc]);

    useEffect(() => {
        if (detail?.myStatus === "active") scheduleRead();
    }, [detail?.myStatus, scheduleRead]);

    useEffect(() => {
        const onVisible = () => document.visibilityState === "visible" && scheduleRead();
        document.addEventListener("visibilitychange", onVisible);
        const timers = typingTimers.current;
        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            clearTimeout(readTimer.current);
            for (const t of timers.values()) clearTimeout(t);
        };
    }, [scheduleRead]);

    const stopTyping = (userId: string) => {
        clearTimeout(typingTimers.current.get(userId));
        typingTimers.current.delete(userId);
        setTyping((t) => {
            if (!(userId in t)) return t;
            const next = { ...t };
            delete next[userId];
            return next;
        });
    };

    // ---------- Live events ----------
    useRealtime((e) => {
        if (e.type === "resync") {
            qc.invalidateQueries({ queryKey: ["messages", id] });
            qc.invalidateQueries({ queryKey: ["conversation", id] });
            return;
        }
        if (e.conversationId !== id) return;
        switch (e.type) {
            case "message": {
                const m = e.message;
                insertMessage(qc, id, m);
                if (m.clientId) setPending((p) => p.filter((x) => x.clientId !== m.clientId));
                if (m.senderId && m.senderId !== meId) {
                    stopTyping(m.senderId);
                    scheduleRead();
                }
                break;
            }
            case "unsent":
                markUnsent(qc, id, e.messageId);
                break;
            case "read":
                qc.setQueryData<ConversationDetail | null>(["conversation", id], (d) =>
                    d ? { ...d, members: d.members.map((m) => (m.id === e.userId ? { ...m, lastReadAt: e.at } : m)) } : d
                );
                break;
            case "typing": {
                if (e.userId === meId) break;
                setTyping((t) => (t[e.userId] === e.name ? t : { ...t, [e.userId]: e.name }));
                clearTimeout(typingTimers.current.get(e.userId));
                typingTimers.current.set(
                    e.userId,
                    setTimeout(() => stopTyping(e.userId), 4500)
                );
                break;
            }
            case "conversation":
                qc.invalidateQueries({ queryKey: ["conversation", id] });
                break;
        }
    });

    // ---------- Older messages (load when you scroll to the top) ----------
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = msgsQ;
    useEffect(() => {
        const root = scrollRef.current;
        const target = topRef.current;
        if (!root || !target || !hasNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
            },
            { root, rootMargin: "300px 0px 0px 0px" }
        );
        io.observe(target);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ---------- Composer ----------
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [text]);

    const toBottom = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));

    const deliver = async (p: Pending) => {
        let res: Awaited<ReturnType<typeof sendMessage>>;
        try {
            res = await sendMessage(id, p.text, p.clientId);
        } catch (err) {
            console.error(err);
            res = { error: "Couldn't reach the server. Tap the message to try again.", message: null };
        }
        if (res.error || !res.message) {
            setPending((all) => all.map((x) => (x.clientId === p.clientId ? { ...x, failed: true } : x)));
            toast.error(res.error ?? "Couldn't send. Tap the message to try again.");
            return;
        }
        insertMessage(qc, id, res.message);
        bumpList(qc, id, res.message);
        setPending((all) => all.filter((x) => x.clientId !== p.clientId));
    };

    const send = () => {
        const body = text.trim();
        if (!body) return;
        const p: Pending = { clientId: newClientId(), text: body.slice(0, MAX_TEXT), createdAt: new Date().toISOString() };
        setPending((all) => [...all, p]);
        setText("");
        setSelected(null);
        toBottom();
        void deliver(p);
    };

    const retry = (p: Pending) => {
        setPending((all) => all.map((x) => (x.clientId === p.clientId ? { ...x, failed: false } : x)));
        void deliver({ ...p, failed: false });
    };

    const onType = (value: string) => {
        setText(value);
        const t = Date.now();
        if (value.trim() && t - lastTypingSent.current > 3000) {
            lastTypingSent.current = t;
            void sendTyping(id);
        }
    };

    const unsend = async (messageId: string) => {
        setSelected(null);
        markUnsent(qc, id, messageId);
        const { error } = await unsendMessage(messageId);
        if (error) {
            toast.error(error);
            qc.invalidateQueries({ queryKey: ["messages", id] });
        } else {
            qc.invalidateQueries({ queryKey: ["conversations"] });
        }
    };

    // ---------- Mute ----------
    const toggleMute = async () => {
        if (!detail) return;
        const muted = !detail.muted;
        qc.setQueryData<ConversationDetail | null>(["conversation", id], (d) => (d ? { ...d, muted } : d));
        qc.setQueryData<ConversationSummary[]>(["conversations", "inbox"], (l) =>
            l?.map((c) => (c.id === id ? { ...c, muted } : c))
        );
        const { error } = await setMuted(id, muted);
        if (error) {
            toast.error(error);
            refreshAll();
        } else {
            toast.success(muted ? "Muted. No pop-ups or push for this chat." : "Unmuted.");
        }
        qc.invalidateQueries({ queryKey: ["messageCounts"] });
    };

    // ---------- Requests ----------
    const refreshAll = () => {
        qc.invalidateQueries({ queryKey: ["conversation", id] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
    };

    const accept = async () => {
        setBusy("accept");
        const { error } = await acceptRequest(id);
        setBusy(null);
        if (error) return toast.error(error);
        refreshAll();
        onAccepted();
        scheduleRead();
    };

    const decline = async () => {
        setBusy("delete");
        const { error } = await deleteRequest(id);
        setBusy(null);
        if (error) return toast.error(error);
        qc.invalidateQueries({ queryKey: ["conversations"] });
        onGone();
    };

    const block = async () => {
        if (!other) return;
        setBusy("block");
        const { error } = await blockUser(other.id);
        if (!error) await deleteRequest(id);
        setBusy(null);
        setConfirmBlock(false);
        if (error) return toast.error(error);
        toast.success(`Blocked @${other.username}.`);
        qc.invalidateQueries({ queryKey: ["conversations"] });
        onGone();
    };

    // ---------- What to draw ----------
    const items: Item[] = useMemo(() => {
        const server = (msgsQ.data?.pages ?? []).flatMap((p) => p.messages).slice().reverse();
        const sent = server.map((m) => ({
            key: m.id,
            id: m.id,
            senderId: m.senderId,
            kind: m.kind,
            text: m.text,
            createdAt: m.createdAt,
            deleted: m.deleted,
        }));
        const waiting = pending.map((p) => ({
            key: p.clientId,
            id: null,
            senderId: meId,
            kind: "text",
            text: p.text,
            createdAt: p.createdAt,
            deleted: false,
            pending: p,
        }));
        return [...sent, ...waiting];
    }, [msgsQ.data, pending, meId]);

    const byId = useMemo(() => new Map((detail?.members ?? []).map((m) => [m.id, m])), [detail]);

    // "Seen" under your latest message.
    const lastSent = [...items].reverse().find((m) => m.kind === "text" && !m.pending);
    let seenLabel: string | null = null;
    if (lastSent && lastSent.senderId === meId && !lastSent.deleted && !pending.length) {
        const readers = others.filter(
            (o) => o.status === "active" && o.lastReadAt && new Date(o.lastReadAt) >= new Date(lastSent.createdAt)
        );
        const active = others.filter((o) => o.status === "active");
        if (!detail?.isGroup) seenLabel = readers.length ? "Seen" : "Sent";
        else if (readers.length && readers.length === active.length) seenLabel = "Seen by everyone";
        else if (readers.length)
            seenLabel = `Seen by ${readers
                .slice(0, 3)
                .map((r) => r.name.split(" ")[0])
                .join(", ")}${readers.length > 3 ? ` +${readers.length - 3}` : ""}`;
        else seenLabel = "Sent";
    }

    const typingNames = Object.values(typing);

    if (detailQ.isLoading) {
        return (
            <div className="grid flex-1 place-items-center">
                <Loader size={6} color="text-gray-400" />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-gray-500">This chat isn&apos;t available.</p>
                <button onClick={onGone} className="text-sm font-medium underline cursor-pointer">
                    Back to messages
                </button>
            </div>
        );
    }

    const isRequest = detail.myStatus === "request";
    const subtitle = detail.isGroup
        ? `${detail.members.length} members`
        : other?.username
        ? `@${other.username}`
        : "";

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <header className="flex items-center gap-2 border-b border-gray-200 px-2 py-2 md:px-4">
                <button
                    onClick={onBack}
                    aria-label="Back"
                    className="rounded-md p-1 text-gray-600 hover:bg-gray-100 md:hidden cursor-pointer"
                >
                    <ChevronLeft className="size-5" />
                </button>
                {other?.username ? (
                    <Link href={`/profile/${other.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <ChatAvatar people={others} isGroup={false} size="sm" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{detail.title}</span>
                            <span className="block truncate text-xs text-gray-500">{subtitle}</span>
                        </span>
                    </Link>
                ) : (
                    <button onClick={() => setInfoOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
                        <ChatAvatar people={others} isGroup={detail.isGroup} size="sm" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{detail.title}</span>
                            <span className="block truncate text-xs text-gray-500">{subtitle}</span>
                        </span>
                    </button>
                )}
                {detail.myStatus === "active" && (
                    <button
                        onClick={toggleMute}
                        aria-label={detail.muted ? "Unmute" : "Mute"}
                        title={detail.muted ? "Muted (tap to unmute)" : "Mute"}
                        className={`rounded-md p-1.5 hover:bg-gray-100 cursor-pointer ${detail.muted ? "text-black" : "text-gray-500"}`}
                    >
                        {detail.muted ? <BellOff className="size-5" /> : <Bell className="size-5" />}
                    </button>
                )}
                <button
                    onClick={() => setInfoOpen((o) => !o)}
                    aria-label="Chat details"
                    className={`rounded-md p-1.5 hover:bg-gray-100 cursor-pointer ${infoOpen ? "text-black" : "text-gray-600"}`}
                >
                    <Info className="size-5" />
                </button>
            </header>

            {/* Messages (column-reverse keeps you pinned to the newest one) */}
            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto overscroll-contain px-3 py-3 md:px-6">
                <div>
                    <div ref={topRef} className="flex justify-center py-2">
                        {msgsQ.isLoading || isFetchingNextPage ? (
                            <Loader size={5} color="text-gray-400" />
                        ) : !hasNextPage ? (
                            <div className="flex flex-col items-center gap-1 py-4 text-center">
                                <ChatAvatar people={others} isGroup={detail.isGroup} />
                                <p className="text-sm font-semibold">{detail.title}</p>
                                <p className="text-xs text-gray-400">Start of your chat</p>
                            </div>
                        ) : null}
                    </div>

                    {items.map((m, i) => {
                        const prev = items[i - 1];
                        const next = items[i + 1];
                        const stamp = needsStamp(prev?.createdAt, m.createdAt);
                        if (m.kind === "system") {
                            return (
                                <div key={m.key}>
                                    {stamp && <p className="mt-4 mb-1 text-center text-[11px] text-gray-400">{stampLabel(m.createdAt, now)}</p>}
                                    <p className="my-2 text-center text-xs text-gray-500">{m.text}</p>
                                </div>
                            );
                        }
                        const mine = m.senderId === meId;
                        const joinPrev = !!prev && !stamp && prev.kind !== "system" && prev.senderId === m.senderId;
                        const joinNext =
                            !!next &&
                            next.kind !== "system" &&
                            next.senderId === m.senderId &&
                            !needsStamp(m.createdAt, next.createdAt);
                        const sender = m.senderId ? byId.get(m.senderId) : undefined;
                        const isSelected = selected === m.key;
                        const corners = mine
                            ? `${joinPrev ? "rounded-tr-md" : ""} ${joinNext ? "rounded-br-md" : ""}`
                            : `${joinPrev ? "rounded-tl-md" : ""} ${joinNext ? "rounded-bl-md" : ""}`;

                        return (
                            <div key={m.key}>
                                {stamp && <p className="mt-4 mb-2 text-center text-[11px] text-gray-400">{stampLabel(m.createdAt, now)}</p>}
                                {!mine && detail.isGroup && !joinPrev && (
                                    <p className="mb-0.5 ml-10 mt-2 text-[11px] text-gray-500">{sender?.name ?? "Someone"}</p>
                                )}
                                <div className={`flex items-end gap-2 ${joinPrev ? "mt-0.5" : "mt-2"} ${mine ? "justify-end" : ""}`}>
                                    {!mine && (
                                        <span className="w-8 shrink-0">
                                            {!joinNext && <UserIcon image={sender?.image} size="size-8" />}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            m.pending?.failed ? retry(m.pending) : setSelected(isSelected ? null : m.key)
                                        }
                                        title={clock(m.createdAt)}
                                        className={`max-w-[78%] md:max-w-[65%] rounded-2xl px-3.5 py-2 text-left text-sm leading-snug whitespace-pre-wrap break-words cursor-pointer ${corners} ${
                                            m.deleted
                                                ? "border border-gray-200 bg-white italic text-gray-400"
                                                : mine
                                                ? `bg-neutral-900 text-white ${m.pending ? "opacity-60" : ""} ${m.pending?.failed ? "ring-2 ring-red-400" : ""}`
                                                : "bg-gray-100 text-gray-900"
                                        }`}
                                    >
                                        {m.deleted ? "Message unsent" : <Linkified text={m.text} mine={mine} />}
                                    </button>
                                </div>
                                {m.pending?.failed && (
                                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-red-500">
                                        <RotateCcw className="size-3" /> Not sent. Tap to try again
                                    </p>
                                )}
                                {isSelected && !m.pending && (
                                    <div className={`mt-1 flex items-center gap-3 text-[11px] text-gray-500 ${mine ? "justify-end" : "ml-10"}`}>
                                        <span>{stampLabel(m.createdAt, now)}</span>
                                        {mine && !m.deleted && m.id && (
                                            <button onClick={() => unsend(m.id!)} className="font-medium text-red-600 hover:underline cursor-pointer">
                                                Unsend
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {pending.some((p) => !p.failed) && <p className="mt-1 text-right text-[11px] text-gray-400">Sending…</p>}
                    {seenLabel && <p className="mt-1 text-right text-[11px] text-gray-400">{seenLabel}</p>}

                    {typingNames.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex gap-0.5 rounded-2xl bg-gray-100 px-3 py-2.5">
                                <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-gray-400" />
                            </span>
                            {detail.isGroup &&
                                (typingNames.length === 1
                                    ? `${typingNames[0].split(" ")[0]} is typing`
                                    : `${typingNames.length} people are typing`)}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom: request buttons, a notice, or the message box */}
            {isRequest ? (
                <div className="space-y-2 border-t border-gray-200 p-4 text-center">
                    <p className="text-sm font-medium">
                        {detail.isGroup ? `You were added to ${detail.title}` : `${detail.title} wants to message you`}
                    </p>
                    <p className="text-xs text-gray-500">They won&apos;t know you&apos;ve seen it until you accept.</p>
                    <div className="flex justify-center gap-2 pt-1">
                        {!detail.isGroup && (
                            <button
                                onClick={() => setConfirmBlock(true)}
                                disabled={!!busy}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                            >
                                Block
                            </button>
                        )}
                        <button
                            onClick={decline}
                            disabled={!!busy}
                            className="flex items-center gap-1.5 rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                        >
                            {busy === "delete" && <Loader size={3} color="text-gray-500" />} Delete
                        </button>
                        <button
                            onClick={accept}
                            disabled={!!busy}
                            className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 cursor-pointer disabled:opacity-50"
                        >
                            {busy === "accept" && <Loader size={3} />} Accept
                        </button>
                    </div>
                </div>
            ) : !detail.canSend ? (
                <p className="border-t border-gray-200 p-4 text-center text-sm text-gray-500">You can&apos;t message this person.</p>
            ) : (
                <div className="border-t border-gray-200 px-3 py-2 md:px-4">
                    {other && other.status === "request" && (
                        <p className="pb-1.5 text-center text-[11px] text-gray-400">
                            They&apos;ll get this as a message request.
                        </p>
                    )}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                        className="flex items-end gap-2"
                    >
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={text}
                            maxLength={MAX_TEXT}
                            onChange={(e) => onType(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            placeholder="Message…"
                            className="min-h-10 flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-5 outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            aria-label="Send"
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:bg-gray-300 cursor-pointer disabled:cursor-default"
                        >
                            <SendHorizontal className="size-4.5" />
                        </button>
                    </form>
                </div>
            )}

            {infoOpen && (
                <ChatInfo
                    detail={detail}
                    meId={meId}
                    onClose={() => setInfoOpen(false)}
                    onGone={onGone}
                />
            )}

            <ConfirmModal
                open={confirmBlock}
                isPending={busy === "block"}
                title={`Block ${other?.name ?? "this person"}?`}
                text="They won't be able to message you, see your profile or find your content. They aren't told."
                confirmText="Block"
                onConfirm={block}
                onClose={() => setConfirmBlock(false)}
            />
        </div>
    );
}
