"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
    Coffee,
    Eye,
    Folder,
    Heart,
    ImageIcon,
    MessageCircle,
    ShieldAlert,
    Flag,
    UserCheck,
    UserPlus,
    Users,
    type LucideIcon,
} from "lucide-react";
import { UserIcon } from "@/components/general/UserIcon";
import { Skeleton } from "@/components/general/Skeleton";
import Loader from "@/components/general/Loader";
import { markAllNotificationsRead, type NotificationItem } from "@/actions/notifications/notifications";
import { UNREAD_KEY, useNotificationsList } from "@/hooks/useNotifications";
import { previewUrl } from "@/lib/imageUrl";
import { timeShort } from "@/lib/timeShort";

// Small icon badge per kind of notification.
const ICONS: Record<string, { icon: LucideIcon; className: string }> = {
    like: { icon: Heart, className: "bg-red-500" },
    comment: { icon: MessageCircle, className: "bg-blue-500" },
    follow: { icon: UserPlus, className: "bg-neutral-800" },
    friend_request: { icon: Users, className: "bg-neutral-800" },
    friend_accept: { icon: UserCheck, className: "bg-green-600" },
    friend_post: { icon: ImageIcon, className: "bg-purple-500" },
    friend_project: { icon: Folder, className: "bg-amber-500" },
    views: { icon: Eye, className: "bg-neutral-500" },
    tip: { icon: Coffee, className: "bg-amber-600" },
    moderation: { icon: ShieldAlert, className: "bg-red-600" },
    report: { icon: Flag, className: "bg-orange-500" },
    message_request: { icon: MessageCircle, className: "bg-blue-600" },
};

// "Sam", "Sam and Alex", "Sam, Alex and 12 others"
function whoText(n: NotificationItem) {
    const names = n.actors.map((a) => a.name || `@${a.username}`);
    const others = Math.max(0, n.actorCount - names.length);
    if (names.length === 0) return "";
    if (others > 0) {
        const shown = names.slice(0, 2);
        const rest = n.actorCount - shown.length;
        return `${shown.join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`;
    }
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function message(n: NotificationItem) {
    const thing = n.target?.kind === "project" ? "project" : "post";
    switch (n.type) {
        case "like":
            return `liked your ${thing}.`;
        case "comment":
            return `commented on your post${n.preview ? `: “${n.preview}”` : "."}`;
        case "follow":
            return "started following you.";
        case "friend_request":
            return "sent you a friend request.";
        case "friend_accept":
            return "accepted your friend request.";
        case "friend_post":
            return "shared a new post.";
        case "friend_project":
            return `published a new project${n.target?.title ? `: ${n.target.title}` : "."}`;
        case "tip":
            return `bought you a coffee${n.preview ? `: “${n.preview}”` : "."}`;
        case "message_request":
            return n.preview?.startsWith("group:")
                ? `added you to the group “${n.preview.slice(6)}”.`
                : `sent you a message request${n.preview ? `: “${n.preview}”` : "."}`;
        default:
            return "";
    }
}

function sectionOf(n: NotificationItem, unreadAtOpen: Set<string>) {
    if (unreadAtOpen.has(n.id)) return "New";
    const age = Date.now() - new Date(n.updatedAt).getTime();
    if (age < 86_400_000) return "Today";
    if (age < 7 * 86_400_000) return "This week";
    return "Earlier";
}

const Row = ({ n, isNew }: { n: NotificationItem; isNew: boolean }) => {
    const meta = ICONS[n.type] ?? ICONS.views;
    const Icon = meta.icon;

    return (
        <li>
            <Link
                href={n.href}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-gray-200 md:gap-3 md:px-3 md:py-3 ${
                    isNew ? "bg-blue-50" : ""
                }`}
            >
                {/* Avatars (up to 2, overlapping) + type badge */}
                <div className="relative size-8 shrink-0 md:size-11">
                    {n.type === "views" ? (
                        <div className="grid size-8 place-items-center rounded-full bg-gray-300 md:size-11">
                            <Eye className="h-4 w-4 text-gray-700 md:h-5 md:w-5" />
                        </div>
                    ) : n.type === "moderation" || n.type === "report" ? (
                        <div className="grid size-8 place-items-center rounded-full bg-red-100 md:size-11">
                            <ShieldAlert className="h-4 w-4 text-red-600 md:h-5 md:w-5" />
                        </div>
                    ) : n.actors.length > 1 ? (
                        <>
                            <div className="absolute left-0 top-0">
                                <UserIcon image={n.actors[1].image} size="size-5 md:size-8" />
                            </div>
                            <div className="absolute bottom-0 right-0 rounded-full ring-2 ring-gray-100">
                                <UserIcon image={n.actors[0].image} size="size-5 md:size-8" />
                            </div>
                        </>
                    ) : (
                        <UserIcon image={n.actors[0]?.image} size="size-8 md:size-11" />
                    )}
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full text-white ring-2 ring-gray-100 md:size-5 ${meta.className}`}
                    >
                        <Icon className="size-2.5 md:size-3" />
                    </span>
                </div>

                {/* Text */}
                <p className="min-w-0 flex-1 text-xs leading-snug md:text-sm">
                    {n.type === "views" ? (
                        <>
                            Your {n.target?.kind ?? "post"} reached{" "}
                            <span className="font-semibold">{Number(n.preview).toLocaleString()} views</span>.
                        </>
                    ) : n.type === "moderation" || n.type === "report" ? (
                        <>
                            <span className="font-semibold">{n.type === "report" ? "Report: " : "Inkference admin: "}</span>
                            <span className="break-words">{n.preview}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-semibold">{whoText(n)}</span>{" "}
                            <span className="break-words">{message(n)}</span>
                        </>
                    )}{" "}
                    <span className="whitespace-nowrap text-gray-500">{timeShort(n.updatedAt)}</span>
                </p>

                {/* Thumbnail of the post/project */}
                {n.target?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={previewUrl(n.target.image, 120)}
                        alt=""
                        loading="lazy"
                        className="size-8 shrink-0 rounded object-cover md:size-11 md:rounded-md"
                    />
                )}

                {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="New" />}
            </Link>
        </li>
    );
};

const Notifications = () => {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useNotificationsList();
    const items = data?.pages.flatMap((p) => p.items) ?? [];

    // Remember what was unread when you opened the page (so it stays
    // highlighted), then mark everything as read and clear the badge.
    const [openedUnread, setOpenedUnread] = useState<Set<string> | null>(null);
    if (openedUnread === null && data) {
        setOpenedUnread(new Set(items.filter((n) => !n.read).map((n) => n.id)));
    }
    const unreadAtOpen = openedUnread ?? new Set<string>();

    const markedRef = useRef(false);
    useEffect(() => {
        if (markedRef.current || !openedUnread || openedUnread.size === 0) return;
        markedRef.current = true;
        markAllNotificationsRead().then(() => queryClient.setQueryData(UNREAD_KEY, 0));
    }, [openedUnread, queryClient]);

    // Load more when the bottom comes into view.
    const moreRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = moreRef.current;
        if (!el || !hasNextPage) return;
        const obs = new IntersectionObserver(
            ([e]) => e.isIntersecting && !isFetchingNextPage && fetchNextPage(),
            { rootMargin: "300px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <ul className="space-y-2">
                {[...Array(6)].map((_, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded-md" />
                            <Skeleton className="h-3 w-1/3 rounded-md" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    if (isError) return <p className="text-sm text-red-600">Couldn&apos;t load notifications.</p>;

    if (items.length === 0) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <p className="font-medium text-gray-800">No notifications yet</p>
                <p className="text-sm">
                    Likes, comments, follows and friend activity will show up here.
                </p>
            </div>
        );
    }

    // Group into New / Today / This week / Earlier.
    const sections: { title: string; items: NotificationItem[] }[] = [];
    for (const n of items) {
        const title = sectionOf(n, unreadAtOpen);
        const last = sections[sections.length - 1];
        if (last?.title === title) last.items.push(n);
        else sections.push({ title, items: [n] });
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {sections.map((s, i) => (
                <section key={`${s.title}-${i}`}>
                    <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:px-3">{s.title}</h3>
                    <ul>
                        {s.items.map((n) => (
                            <Row key={n.id} n={n} isNew={unreadAtOpen.has(n.id)} />
                        ))}
                    </ul>
                </section>
            ))}

            {hasNextPage && (
                <div ref={moreRef} className="flex justify-center py-4">
                    {isFetchingNextPage && <Loader size={6} color="text-gray-500" />}
                </div>
            )}
        </div>
    );
};

export default Notifications;
