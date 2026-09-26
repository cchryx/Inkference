"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, ChevronLeft, MessagesSquare, MoreHorizontal, Search, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import UserPicker, { type PickedUser } from "@/components/general/UserPicker";
import ConfirmModal from "@/components/general/ConfirmModal";
import { MENU, MENU_ITEM, MENU_ITEM_DANGER } from "@/lib/menuStyles";
import {
    createGroup,
    hideConversation,
    listConversations,
    markRead,
    setMuted,
    startDirect,
    type ConversationDetail,
    type ConversationSummary,
} from "@/actions/messages";
import { useMessageCounts, useRealtime } from "./RealtimeProvider";
import ChatView from "./ChatView";
import { ChatAvatar, shortAgo } from "./chatUtils";

type Folder = "inbox" | "requests";

function preview(c: ConversationSummary, meId: string) {
    const last = c.last;
    if (!last) return "No messages yet";
    if (last.deleted) return "Message unsent";
    if (last.kind === "system") return last.text;
    if (last.senderId === meId) return `You: ${last.text}`;
    if (c.isGroup) {
        const who = c.people.find((p) => p.id === last.senderId)?.name.split(" ")[0];
        return who ? `${who}: ${last.text}` : last.text;
    }
    return last.text;
}

/** Chats list on the left, the open chat on the right (one at a time on phones). */
export default function MessagesApp({ meId }: { meId: string }) {
    const qc = useQueryClient();
    const params = useSearchParams();
    const activeId = params.get("c");
    const tabParam = params.get("tab");

    const [folder, setFolder] = useState<Folder>(tabParam === "requests" ? "requests" : "inbox");
    // A link to ?tab=requests while already here (e.g. tapping a request pop-up) switches tabs too.
    const [lastTab, setLastTab] = useState(tabParam);
    if (tabParam !== lastTab) {
        setLastTab(tabParam);
        if (tabParam === "requests" || tabParam === "inbox") setFolder(tabParam);
    }
    const [toDelete, setToDelete] = useState<ConversationSummary | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [composing, setComposing] = useState(false);
    const [search, setSearch] = useState("");
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(t);
    }, []);

    const listQ = useQuery({
        queryKey: ["conversations", folder],
        queryFn: () => listConversations(folder),
        staleTime: 0,
        refetchOnMount: "always",
    });
    const { data: counts } = useMessageCounts();

    // Open a chat without reloading the page (the back button still works).
    // Pass null as the state: Next.js ignores history changes that carry its own state.
    const pushedChat = useRef(false);
    const open = (id: string | null) => {
        setComposing(false);
        const url = id ? `/social/messages?c=${id}` : "/social/messages";
        if (id && !activeId) {
            pushedChat.current = true;
            window.history.pushState(null, "", url);
        } else {
            window.history.replaceState(null, "", url);
        }
    };
    const back = () => {
        setComposing(false);
        if (activeId && pushedChat.current) {
            pushedChat.current = false;
            window.history.back();
        } else {
            window.history.replaceState(null, "", "/social/messages");
        }
    };

    // ---------- Row menu: mute, mark read, delete ----------
    const patchChat = (id: string, patch: Partial<ConversationSummary>) =>
        qc.setQueryData<ConversationSummary[]>(["conversations", folder], (l) =>
            l?.map((c) => (c.id === id ? { ...c, ...patch } : c))
        );

    const toggleMute = async (c: ConversationSummary) => {
        const muted = !c.muted;
        patchChat(c.id, { muted });
        qc.setQueryData<ConversationDetail | null>(["conversation", c.id], (d) => (d ? { ...d, muted } : d));
        const { error } = await setMuted(c.id, muted);
        if (error) {
            toast.error(error);
            qc.invalidateQueries({ queryKey: ["conversations"] });
        } else {
            toast.success(muted ? `Muted ${c.title}.` : `Unmuted ${c.title}.`);
        }
        qc.invalidateQueries({ queryKey: ["messageCounts"] });
    };

    const readChat = async (c: ConversationSummary) => {
        patchChat(c.id, { unread: 0 });
        await markRead(c.id);
    };

    const deleteChat = async () => {
        if (!toDelete) return;
        setDeleting(true);
        const { error } = await hideConversation(toDelete.id);
        setDeleting(false);
        if (error) return toast.error(error);
        qc.setQueryData<ConversationSummary[]>(["conversations", folder], (l) => l?.filter((c) => c.id !== toDelete.id));
        if (toDelete.id === activeId) back();
        setToDelete(null);
        qc.invalidateQueries({ queryKey: ["messageCounts"] });
    };

    // Live: move chats to the top, bump unread numbers.
    useRealtime((e) => {
        if (e.type === "message") {
            const m = e.message;
            let found = false;
            qc.setQueryData<ConversationSummary[]>(["conversations", "inbox"], (list) => {
                const c = list?.find((x) => x.id === e.conversationId);
                if (!list || !c) return list;
                found = true;
                const bump = m.senderId !== meId && m.kind === "text" && e.conversationId !== activeId;
                const next: ConversationSummary = {
                    ...c,
                    last: { text: m.text.slice(0, 120), senderId: m.senderId, kind: m.kind, deleted: false, createdAt: m.createdAt },
                    lastMessageAt: m.createdAt,
                    unread: bump ? Math.min(99, c.unread + 1) : c.unread,
                };
                return [next, ...list.filter((x) => x.id !== c.id)];
            });
            if (!found) qc.invalidateQueries({ queryKey: ["conversations"] });
        } else if (e.type === "read") {
            if (e.userId === meId) {
                qc.setQueryData<ConversationSummary[]>(["conversations", "inbox"], (l) =>
                    l?.map((c) => (c.id === e.conversationId ? { ...c, unread: 0 } : c))
                );
            }
        } else if (e.type !== "typing") {
            qc.invalidateQueries({ queryKey: ["conversations"] });
        }
    });

    const chats = useMemo(() => {
        const list = listQ.data ?? [];
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.people.some((p) => p.name.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q))
        );
    }, [listQ.data, search]);

    const showMain = !!activeId || composing;
    const requests = counts?.requests ?? 0;

    return (
        <div className="flex h-full min-h-0 w-full">
            {/* ---------- Chat list ---------- */}
            <aside
                className={`${showMain ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-gray-200 bg-gray-100 md:w-80`}
            >
                <div className="space-y-3 px-4 pb-2 pt-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Messages</h1>
                        <button
                            onClick={() => setComposing(true)}
                            aria-label="New message"
                            title="New message"
                            className="rounded-md p-1.5 text-gray-700 hover:bg-gray-200 hover:text-black cursor-pointer"
                        >
                            <SquarePen className="size-5" />
                        </button>
                    </div>

                    <div className="flex gap-1 rounded-lg bg-gray-200 p-1 text-sm">
                        {(["inbox", "requests"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFolder(f)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium cursor-pointer ${
                                    folder === f ? "bg-white shadow-sm" : "text-gray-600 hover:text-black"
                                }`}
                            >
                                {f === "inbox" ? "Chats" : "Requests"}
                                {f === "requests" && requests > 0 && (
                                    <span className="min-w-4 rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">{requests}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search chats"
                            className="w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-sm outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
                    {listQ.isLoading &&
                        [0, 1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-3 px-2 py-2">
                                <Skeleton className="size-12 rounded-full" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-1/2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </li>
                        ))}

                    {!listQ.isLoading && chats.length === 0 && (
                        <li className="px-4 py-10 text-center text-sm text-gray-500">
                            {search
                                ? "No chats match that."
                                : folder === "inbox"
                                ? "No chats yet. Tap the pencil to start one."
                                : "No message requests. People who can't message you directly land here first."}
                        </li>
                    )}

                    {chats.map((c) => {
                        const isActive = c.id === activeId;
                        const unread = c.unread > 0 && !c.muted;
                        return (
                            <li key={c.id} className="group relative">
                                <button
                                    onClick={() => open(c.id)}
                                    className={`flex w-full items-center gap-3 rounded-lg py-2 pl-2 text-left cursor-pointer ${
                                        folder === "inbox" ? "pr-9" : "pr-2"
                                    } ${isActive ? "bg-gray-300" : "hover:bg-gray-200"}`}
                                >
                                    <ChatAvatar people={c.people} isGroup={c.isGroup} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1">
                                            <span className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>{c.title}</span>
                                            {c.muted && <BellOff className="size-3 shrink-0 text-gray-400" />}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs">
                                            <span className={`truncate ${unread ? "font-semibold text-black" : "text-gray-500"}`}>
                                                {preview(c, meId)}
                                            </span>
                                            <span className="shrink-0 text-gray-400">· {shortAgo(c.lastMessageAt, now)}</span>
                                        </span>
                                    </span>
                                    {c.unread > 0 && (
                                        <span
                                            className={`size-2.5 shrink-0 rounded-full ${c.muted ? "bg-gray-400" : "bg-blue-600"}`}
                                            aria-label={`${c.unread} unread`}
                                        />
                                    )}
                                </button>
                                {folder === "inbox" && (
                                    <RowMenu
                                        chat={c}
                                        onMute={() => toggleMute(c)}
                                        onRead={() => readChat(c)}
                                        onDelete={() => setToDelete(c)}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            </aside>

            {/* ---------- Open chat ---------- */}
            <main className={`${showMain ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col bg-white`}>
                {composing ? (
                    <NewChat
                        onBack={() => setComposing(false)}
                        onOpen={(id) => {
                            qc.invalidateQueries({ queryKey: ["conversations"] });
                            setFolder("inbox");
                            open(id);
                        }}
                    />
                ) : activeId ? (
                    <ChatView
                        key={activeId}
                        id={activeId}
                        meId={meId}
                        now={now}
                        onBack={back}
                        onGone={back}
                        onAccepted={() => setFolder("inbox")}
                    />
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                        <span className="grid size-16 place-items-center rounded-full border-2 border-black">
                            <MessagesSquare className="size-7" />
                        </span>
                        <p className="text-lg font-semibold">Your messages</p>
                        <p className="max-w-xs text-sm text-gray-500">Chat one-on-one or in groups. Messages show up instantly.</p>
                        <button
                            onClick={() => setComposing(true)}
                            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 cursor-pointer"
                        >
                            New message
                        </button>
                    </div>
                )}
            </main>

            <ConfirmModal
                open={!!toDelete}
                isPending={deleting}
                title={`Delete chat with ${toDelete?.title ?? ""}?`}
                text="It's removed from your list only. It comes back if someone sends a new message."
                confirmText="Delete"
                onConfirm={deleteChat}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}

/** ⋯ on a chat in the list (shows on hover on computers, always on phones). */
function RowMenu({
    chat,
    onMute,
    onRead,
    onDelete,
}: {
    chat: ConversationSummary;
    onMute: () => void;
    onRead: () => void;
    onDelete: () => void;
}) {
    const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

    useEffect(() => {
        if (!pos) return;
        const outside = (e: Event) => {
            if (!(e.target as Element | null)?.closest?.("[data-row-menu]")) setPos(null);
        };
        const close = () => setPos(null);
        document.addEventListener("mousedown", outside);
        document.addEventListener("touchstart", outside);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);
        return () => {
            document.removeEventListener("mousedown", outside);
            document.removeEventListener("touchstart", outside);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, [pos]);

    const pick = (fn: () => void) => () => {
        setPos(null);
        fn();
    };

    return (
        <>
            <button
                data-row-menu
                aria-label="Chat options"
                onClick={(e) => {
                    if (pos) return setPos(null);
                    const r = e.currentTarget.getBoundingClientRect();
                    const top = r.bottom + 160 > window.innerHeight ? r.top - 124 : r.bottom + 4;
                    setPos({ top, right: window.innerWidth - r.right });
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 hover:bg-gray-300 hover:text-black cursor-pointer md:opacity-0 md:focus:opacity-100 md:group-hover:opacity-100 ${
                    pos ? "md:opacity-100" : ""
                }`}
            >
                <MoreHorizontal className="size-4" />
            </button>
            {pos &&
                createPortal(
                    <div data-row-menu className={`fixed z-50 w-52 ${MENU}`} style={{ top: pos.top, right: pos.right }}>
                        <button onClick={pick(onMute)} className={MENU_ITEM}>
                            {chat.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                            {chat.muted ? "Unmute" : chat.isGroup ? "Mute group" : "Mute chat"}
                        </button>
                        {chat.unread > 0 && (
                            <button onClick={pick(onRead)} className={MENU_ITEM}>
                                <CheckCheck className="size-4" /> Mark as read
                            </button>
                        )}
                        <button onClick={pick(onDelete)} className={MENU_ITEM_DANGER}>
                            <Trash2 className="size-4" /> Delete chat
                        </button>
                    </div>,
                    document.body
                )}
        </>
    );
}

/** Pick 1 person for a chat, or 2+ for a group. */
function NewChat({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
    const [picked, setPicked] = useState<PickedUser[]>([]);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const group = picked.length > 1;

    const start = async () => {
        if (!picked.length) return;
        setBusy(true);
        try {
            await go();
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong starting the chat. Try again.");
        } finally {
            setBusy(false);
        }
    };

    const go = async () => {
        if (!group) {
            const res = await startDirect(picked[0].id);
            if (res.error || !res.id) return toast.error(res.error ?? "Couldn't start the chat.");
            return onOpen(res.id);
        }
        const res = await createGroup({ name, userIds: picked.map((u) => u.id) });
        if (res.error || !res.id) return toast.error(res.error ?? "Couldn't create the group.");
        if (res.skipped) toast.message(`${res.skipped} ${res.skipped === 1 ? "person doesn't" : "people don't"} take messages from you, so they weren't added.`);
        onOpen(res.id);
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-center gap-2 border-b border-gray-200 px-2 py-3 md:px-4">
                <button onClick={onBack} aria-label="Back" className="rounded-md p-1 text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <ChevronLeft className="size-5" />
                </button>
                <h2 className="font-semibold">New message</h2>
            </header>
            <div className="mx-auto w-full max-w-lg flex-1 space-y-4 overflow-y-auto p-4">
                <UserPicker value={picked} onChange={setPicked} placeholder="Search people…" disabled={busy} />
                {group && (
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        placeholder="Group name (optional)"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                    />
                )}
                <button
                    onClick={start}
                    disabled={!picked.length || busy}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-gray-300 cursor-pointer disabled:cursor-default"
                >
                    {busy && <Loader size={4} />}
                    {group ? `Create group (${picked.length + 1})` : "Chat"}
                </button>
                <p className="text-center text-xs text-gray-500">
                    Friends get your message right away. Others get a message request, if their settings allow it.
                </p>
            </div>
        </div>
    );
}
