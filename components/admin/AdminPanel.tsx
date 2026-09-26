"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Ban, Check, ChevronDown, Crown, ExternalLink, Flag, HardDrive, Search, ShieldAlert, ShieldCheck, Trash2, Undo2, UserCog, Users } from "lucide-react";
import { useAdminStatus } from "./useIsAdmin";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import Dropdown from "@/components/general/Dropdown";
import { Skeleton } from "@/components/general/Skeleton";
import { UserIcon } from "@/components/general/UserIcon";
import ConfirmModal from "@/components/general/ConfirmModal";
import ModerateModal, { type ModTarget } from "@/components/admin/ModerateModal";
import {
    banUser,
    deleteUserAccount,
    getAppSettings,
    listCases,
    listUsers,
    resolveCase,
    setStorageLimit,
    setUserRole,
    setUserStorage,
    listReports,
    dismissReports,
    type AdminReport,
    unbanUser,
    type AdminCase,
    type AdminUser,
} from "@/actions/admin";
import { previewUrl } from "@/lib/imageUrl";
import { formatBytes } from "@/lib/storageConfig";

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full space-y-3 rounded-md border border-gray-200 p-4">{children}</div>
);

const TABS = [
    { id: "reports", label: "Reports", icon: Flag },
    { id: "review", label: "Review", icon: ShieldAlert },
    { id: "users", label: "Users", icon: Users },
    { id: "app", label: "App", icon: HardDrive },
] as const;

export const ROLE_BADGE = {
    ceo: { label: "CEO", icon: Crown, className: "bg-amber-100 text-amber-800" },
    hr: { label: "HR", icon: UserCog, className: "bg-violet-100 text-violet-800" },
    admin: { label: "Admin", icon: ShieldCheck, className: "bg-sky-100 text-sky-800" },
} as const;

export function RoleBadge({ role }: { role: string }) {
    const b = ROLE_BADGE[role as keyof typeof ROLE_BADGE];
    if (!b) return null;
    return (
        <span className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${b.className}`}>
            <b.icon className="size-3" /> {b.label}
        </span>
    );
}

/** The admin page: reports, users and app-wide settings. */
export default function AdminPanel({ initialUser, initialTab }: { initialUser?: string; initialTab?: string }) {
    const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(
        initialUser ? "users" : (TABS.find((t) => t.id === initialTab)?.id ?? "reports")
    );
    return (
        <div className="space-y-3">
            <div className="scroll-thin flex max-w-full gap-1 overflow-x-auto rounded-lg bg-gray-200 p-1 w-fit">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                            tab === t.id ? "bg-white font-semibold shadow-sm" : "text-gray-600 hover:text-black"
                        }`}
                    >
                        <t.icon className="size-4" /> {t.label}
                    </button>
                ))}
            </div>
            {tab === "reports" && <UserReports />}
            {tab === "review" && <Reports />}
            {tab === "users" && <UsersTab initialQuery={initialUser} />}
            {tab === "app" && <AppSettings />}
        </div>
    );
}

// ---------------- Reports ----------------

const STATUS_STYLE: Record<string, string> = {
    appealed: "bg-amber-100 text-amber-800",
    flagged: "bg-red-100 text-red-700",
    removed: "bg-gray-200 text-gray-700",
    restored: "bg-green-100 text-green-800",
};

function Reports() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<"open" | "history">("open");
    const { data, isLoading } = useQuery({ queryKey: ["adminCases", view], queryFn: () => listCases(view) });
    const [busy, setBusy] = useState<string | null>(null);

    const decide = async (c: AdminCase, decision: "restore" | "delete") => {
        // (Review tab: flagged things and appeals.)
        setBusy(c.id);
        const res = await resolveCase(c.id, decision);
        setBusy(null);
        if (res.error) return toast.error(res.error);
        toast.success(decision === "restore" ? "Restored. The owner was told." : "Deleted. The owner was told.");
        queryClient.invalidateQueries({ queryKey: ["adminCases"] });
    };

    return (
        <Card>
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-base font-semibold">Review</h1>
                <Dropdown
                    size="sm"
                    value={view}
                    onChange={(v) => setView(v as "open" | "history")}
                    options={[
                        { value: "open", label: "Open" },
                        { value: "history", label: "History" },
                    ]}
                />
            </div>
            <p className="text-xs text-gray-500">
                Flagged things are hidden and get deleted after 3 days. If the owner appeals, they wait for you here.
            </p>

            {isLoading ? (
                <Skeleton className="h-20 w-full rounded-md" />
            ) : !data?.length ? (
                <p className="py-6 text-center text-sm text-gray-500">{view === "open" ? "Nothing to review." : "No history yet."}</p>
            ) : (
                <ul className="space-y-2">
                    {data.map((c) => (
                        <li key={c.id} className="flex gap-3 rounded-lg bg-white p-3 ring-1 ring-black/5">
                            {c.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl(c.image, 200)} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                            ) : (
                                <div className="grid size-16 shrink-0 place-items-center rounded-md bg-gray-100 text-xs text-gray-400">
                                    Text
                                </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-1 text-sm">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.status] ?? ""}`}>
                                        {c.status}
                                    </span>
                                    <span className="truncate font-medium">{c.label}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {c.owner?.username ? (
                                        <Link href={`/profile/${c.owner.username}`} className="hover:underline">
                                            @{c.owner.username}
                                        </Link>
                                    ) : (
                                        "Deleted user"
                                    )}{" "}
                                    · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                    {c.status === "flagged" && c.deleteAt && (
                                        <> · deletes {formatDistanceToNow(new Date(c.deleteAt), { addSuffix: true })}</>
                                    )}
                                </p>
                                <p className="text-xs">
                                    <span className="font-semibold">Reason:</span> {c.reason}
                                </p>
                                {c.appeal && (
                                    <p className="rounded-md bg-amber-50 p-2 text-xs">
                                        <span className="font-semibold">Appeal:</span> {c.appeal}
                                    </p>
                                )}
                                {view === "open" && (
                                    <div className="flex gap-2 pt-1">
                                        <Button size="sm" variant="outline" className="h-7 cursor-pointer" disabled={!!busy} onClick={() => decide(c, "restore")}>
                                            <Undo2 className="size-3.5" /> Restore
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 bg-red-600 hover:bg-red-700 cursor-pointer"
                                            disabled={!!busy}
                                            onClick={() => decide(c, "delete")}
                                        >
                                            {busy === c.id ? <Loader size={4} color="text-white" /> : <Trash2 className="size-3.5" />}
                                            Delete now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

// ---------------- Reports from users ----------------

function UserReports() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["adminReports"], queryFn: () => listReports() });
    const [moderate, setModerate] = useState<AdminReport | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["adminReports"] });

    const dismiss = async (r: AdminReport) => {
        setBusy(r.targetId);
        const res = await dismissReports(r.targetType, r.targetId);
        setBusy(null);
        if (res.error) return toast.error(res.error);
        toast.success("Dismissed.");
        refresh();
    };

    return (
        <Card>
            <h1 className="text-base font-semibold">Reports</h1>
            <p className="text-xs text-gray-500">What people reported, most reported first. Moderate it, or dismiss if it&apos;s fine.</p>
            {isLoading ? (
                <Skeleton className="h-20 w-full rounded-md" />
            ) : !data?.length ? (
                <p className="py-6 text-center text-sm text-gray-500">No open reports.</p>
            ) : (
                <ul className="space-y-2">
                    {data.map((r) => (
                        <li key={`${r.targetType}:${r.targetId}`} className="flex gap-3 rounded-lg bg-white p-3 ring-1 ring-black/5">
                            {r.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl(r.image, 200)} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                            ) : (
                                <div className="grid size-16 shrink-0 place-items-center rounded-md bg-gray-100 text-xs text-gray-400">
                                    {r.targetType}
                                </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-1 text-sm">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-800">
                                        {r.count} report{r.count === 1 ? "" : "s"}
                                    </span>
                                    <span className="truncate font-medium">{r.label}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {r.owner?.username ? (
                                        <Link href={`/profile/${r.owner.username}`} className="hover:underline">
                                            @{r.owner.username}
                                        </Link>
                                    ) : (
                                        "Unknown owner"
                                    )}{" "}
                                    · last {formatDistanceToNow(new Date(r.lastAt), { addSuffix: true })}
                                </p>
                                <p className="text-xs">{r.reasons.map((x) => `${x.label}${x.count > 1 ? ` ×${x.count}` : ""}`).join(" · ")}</p>
                                {r.details.map((d, i) => (
                                    <p key={i} className="rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                                        &ldquo;{d}&rdquo;
                                    </p>
                                ))}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {r.link && (
                                        <Link href={r.link} target="_blank" className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs ring-1 ring-gray-300 hover:bg-gray-100">
                                            <ExternalLink className="size-3.5" /> Open
                                        </Link>
                                    )}
                                    <Button size="sm" className="h-7 bg-red-600 hover:bg-red-700 cursor-pointer" onClick={() => setModerate(r)}>
                                        <ShieldAlert className="size-3.5" /> Moderate
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 cursor-pointer" disabled={busy === r.targetId} onClick={() => dismiss(r)}>
                                        {busy === r.targetId ? <Loader size={4} color="text-gray-700" /> : <Check className="size-3.5" />} Dismiss
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {moderate && (
                <ModerateModal
                    targetType={moderate.targetType as ModTarget}
                    targetId={moderate.targetId}
                    onClose={() => {
                        setModerate(null);
                        refresh();
                    }}
                />
            )}
        </Card>
    );
}

// ---------------- Users ----------------

function UsersTab({ initialQuery = "" }: { initialQuery?: string }) {
    const [input, setInput] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);

    // Search shortly after typing stops.
    useEffect(() => {
        const t = setTimeout(() => setQuery(input), 300);
        return () => clearTimeout(t);
    }, [input]);

    const users = useInfiniteQuery({
        queryKey: ["adminUsers", query],
        queryFn: ({ pageParam }) => listUsers(query, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor,
    });
    const list = users.data?.pages.flatMap((p) => p.users) ?? [];

    return (
        <Card>
            <h1 className="text-base font-semibold">Users</h1>
            <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-black/10">
                <Search className="size-4 text-gray-400" />
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search name, username or email"
                    className="w-full bg-transparent text-sm outline-none"
                />
            </label>
            {users.isLoading ? (
                <Skeleton className="h-24 w-full rounded-md" />
            ) : list.length ? (
                <ul className="space-y-1.5">
                    {list.map((u) => (
                        <UserRow key={u.id} user={u} startOpen={!!initialQuery && u.username === initialQuery} />
                    ))}
                </ul>
            ) : (
                <p className="py-6 text-center text-sm text-gray-500">No one found.</p>
            )}
            {users.hasNextPage && (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => users.fetchNextPage()}
                    disabled={users.isFetchingNextPage}
                >
                    {users.isFetchingNextPage && <Loader size={4} color="text-gray-700" />} Load more
                </Button>
            )}
        </Card>
    );
}

const DURATIONS = [
    { value: "1", label: "1 day" },
    { value: "3", label: "3 days" },
    { value: "7", label: "1 week" },
    { value: "30", label: "30 days" },
    { value: "90", label: "90 days" },
    { value: "forever", label: "Forever" },
];

function UserRow({ user: u, startOpen }: { user: AdminUser; startOpen?: boolean }) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(!!startOpen);
    const [banning, setBanning] = useState(false);
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState("7");
    const [busy, setBusy] = useState(false);
    const [moderate, setModerate] = useState<ModTarget | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const { canAssign } = useAdminStatus();
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] });

    const run = async (fn: () => Promise<{ error: string | null }>, ok: string) => {
        setBusy(true);
        const res = await fn();
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success(ok);
        refresh();
        return true;
    };

    const ban = async () => {
        const done = await run(
            () => banUser(u.id, { reason, days: duration === "forever" ? null : Number(duration) }),
            "Banned. They'll see why next time they open the app."
        );
        if (done) {
            setBanning(false);
            setReason("");
        }
    };

    const banned = !!u.bannedUntil;
    const forever = banned && new Date(u.bannedUntil!).getFullYear() >= 9000;

    return (
        <li className="rounded-lg bg-white ring-1 ring-black/5">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer"
            >
                <UserIcon image={u.image} size="size-9" />
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{u.name}</span>
                        <RoleBadge role={u.role} />
                        {banned && <span className="rounded bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">banned</span>}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                        @{u.username ?? "no username"} · {u.email}
                    </span>
                </span>
                <span className="hidden text-right text-xs text-gray-500 sm:block">
                    {formatBytes(u.storageBytes)}
                    <span className="block">joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
                </span>
                <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                    {banned && (
                        <div className="rounded-md bg-red-50 p-2 text-xs text-red-800">
                            Banned {forever ? "forever" : `until ${new Date(u.bannedUntil!).toLocaleString()}`}: {u.banReason}
                        </div>
                    )}

                    {!u.manageable && (
                        <p className="text-xs text-gray-500">Staff at your level or above. Only someone higher can change them.</p>
                    )}

                    {u.manageable && canAssign.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Role</span>
                            <Dropdown
                                size="sm"
                                value={u.role}
                                disabled={busy}
                                onChange={(r) => run(() => setUserRole(u.id, r as AdminUser["role"]), "Role updated.")}
                                options={canAssign.map((r) => ({
                                    value: r,
                                    label: r === "hr" ? "HR (can add admins)" : r === "admin" ? "Admin" : "Regular user",
                                }))}
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                        {u.username && (
                            <Link href={`/profile/${u.username}`} className="rounded-md px-2.5 py-1 text-xs ring-1 ring-gray-300 hover:bg-gray-100">
                                View profile
                            </Link>
                        )}
                        {u.manageable && (
                            <>
                                <SmallBtn onClick={() => setModerate("profile_image")}>Remove picture</SmallBtn>
                                <SmallBtn onClick={() => setModerate("banner")}>Remove banner</SmallBtn>
                                <SmallBtn onClick={() => setModerate("bio")}>Clear bio</SmallBtn>
                                <SmallBtn onClick={() => setModerate("resume")}>Remove resume</SmallBtn>
                                {banned ? (
                                    <SmallBtn disabled={busy} onClick={() => run(() => unbanUser(u.id), "Unbanned.")}>
                                        <Check className="size-3.5" /> Unban
                                    </SmallBtn>
                                ) : (
                                    <SmallBtn danger onClick={() => setBanning((b) => !b)}>
                                        <Ban className="size-3.5" /> Ban
                                    </SmallBtn>
                                )}
                                <SmallBtn danger onClick={() => setConfirmDelete(true)}>
                                    <Trash2 className="size-3.5" /> Delete account
                                </SmallBtn>
                            </>
                        )}
                    </div>

                    {(u.manageable || canAssign.includes("hr")) && <StorageEditor user={u} onSaved={refresh} />}

                    {banning && (
                        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={500}
                                rows={2}
                                placeholder="Why? They'll see this."
                                className="w-full resize-none rounded-md bg-white p-2 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-600">For</span>
                                <Dropdown size="sm" value={duration} onChange={setDuration} options={DURATIONS} />
                                <Button size="sm" className="ml-auto h-7 bg-red-600 hover:bg-red-700 cursor-pointer" disabled={busy} onClick={ban}>
                                    {busy && <Loader size={4} color="text-white" />} Ban
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {moderate && (
                <ModerateModal
                    targetType={moderate}
                    targetId={u.id}
                    onClose={() => {
                        setModerate(null);
                        refresh();
                    }}
                />
            )}

            <ConfirmModal
                isPending={busy}
                open={confirmDelete}
                title={`Delete @${u.username}'s account?`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={async () => {
                    const done = await run(() => deleteUserAccount(u.id, confirmText), "Account deleted.");
                    if (done) setConfirmDelete(false);
                }}
                onClose={() => setConfirmDelete(false)}
            >
                <div className="space-y-2">
                    <p>Everything they made is deleted for good. Type their username to confirm.</p>
                    <input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={u.username ?? ""}
                        className="w-full rounded-md bg-white px-2 py-1.5 text-sm ring-1 ring-black/15 outline-none"
                    />
                </div>
            </ConfirmModal>
        </li>
    );
}

/** Give one person extra photo storage, or unlimited. */
function StorageEditor({ user: u, onSaved }: { user: AdminUser; onSaved: () => void }) {
    const [extra, setExtra] = useState(String(u.storageExtraMB));
    const [unlimited, setUnlimited] = useState(u.storageUnlimited);
    const [busy, setBusy] = useState(false);
    const changed = extra !== String(u.storageExtraMB) || unlimited !== u.storageUnlimited;

    const save = async () => {
        setBusy(true);
        const res = await setUserStorage(u.id, { extraMB: Number(extra) || 0, unlimited });
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success("Storage updated.");
        onSaved();
    };

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2.5 text-xs">
            <HardDrive className="size-3.5 text-gray-500" />
            <span className="text-gray-600">Uses {formatBytes(u.storageBytes)}. Extra storage:</span>
            <input
                type="number"
                min={0}
                value={extra}
                disabled={unlimited}
                onChange={(e) => setExtra(e.target.value)}
                className="w-20 rounded-md bg-white px-2 py-1 ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40 disabled:opacity-40"
            />
            <span className="text-gray-600">MB</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="accent-black" />
                Unlimited
            </label>
            {changed && (
                <Button size="sm" className="ml-auto h-7 cursor-pointer" disabled={busy} onClick={save}>
                    {busy && <Loader size={4} color="text-white" />} Save
                </Button>
            )}
        </div>
    );
}

function SmallBtn({
    children,
    onClick,
    danger,
    disabled,
}: {
    children: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ring-1 cursor-pointer disabled:opacity-50 ${
                danger ? "text-red-600 ring-red-200 hover:bg-red-50" : "ring-gray-300 hover:bg-gray-100"
            }`}
        >
            {children}
        </button>
    );
}

// ---------------- App ----------------

function AppSettings() {
    const { data, isLoading } = useQuery({ queryKey: ["appSettings"], queryFn: () => getAppSettings() });
    const [mb, setMb] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const value = mb ?? String(data?.storageLimitMB ?? "");

    const save = async () => {
        setBusy(true);
        const res = await setStorageLimit(Number(value));
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success("Storage limit updated for everyone.");
    };

    return (
        <Card>
            <h1 className="text-base font-semibold">Photo storage per person</h1>
            <p className="text-xs text-gray-500">
                Counts gallery photos, posts, project pictures and profile pictures. Cloudinary&apos;s free plan is about 25 GB a
                month for storage and viewing together.
            </p>
            {isLoading ? (
                <Skeleton className="h-9 w-48 rounded-md" />
            ) : (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={10}
                        max={100000}
                        value={value}
                        onChange={(e) => setMb(e.target.value)}
                        className="w-28 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                    />
                    <span className="text-sm text-gray-600">MB</span>
                    <Button size="sm" onClick={save} disabled={busy} className="cursor-pointer">
                        {busy && <Loader size={4} color="text-white" />} Save
                    </Button>
                </div>
            )}
        </Card>
    );
}
