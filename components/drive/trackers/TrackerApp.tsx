"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ClipboardPaste, MoreHorizontal, Plus, Search, Trash2, Tv, X } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import Modal from "@/components/general/Modal";
import ConfirmModal from "@/components/general/ConfirmModal";
import { Button } from "@/components/ui/button";
import { createDriveFile, deleteDriveFile, renameDriveFile, saveTracker, type TrackerData } from "@/actions/drive/drive";
import {
    BOARD_COLORS,
    TRACKER_LIMIT,
    defaultTracker,
    newTrackerItem,
    parseTrackerList,
    type BoardColor,
    type TrackerItem,
    type TrackerStatus,
} from "@/lib/drive";
import ShowRow from "./ShowRow";
import UpdatedAgo from "@/components/general/UpdatedAgo";

type Props = { initialTrackers: TrackerData[]; initialId: string | null };
type Filter = TrackerStatus | "all";

const SAVE_DELAY = 700;
const FILTERS: { id: Filter; label: string }[] = [
    { id: "watching", label: "Watching" },
    { id: "planned", label: "Plan to watch" },
    { id: "completed", label: "Completed" },
    { id: "all", label: "All" },
];

/** Drive > Trackers: what episode you're on for every show, with "next episode" links. */
export default function TrackerApp({ initialTrackers, initialId }: Props) {
    const router = useRouter();
    const [trackers, setTrackers] = useState(initialTrackers);
    const [currentId, setCurrentId] = useState<string | null>(
        initialTrackers.find((t) => t.id === initialId)?.id ?? initialTrackers[0]?.id ?? null
    );
    const [mobileOpen, setMobileOpen] = useState(!!initialId);
    const [filter, setFilter] = useState<Filter>("watching");
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [draftEp, setDraftEp] = useState("");
    const [openItem, setOpenItem] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // ---------- Saving (shortly after each change) ----------
    const trackersRef = useRef(trackers);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    useEffect(() => {
        trackersRef.current = trackers;
    }, [trackers]);

    const saveOne = useCallback(async (id: string) => {
        timers.current.delete(id);
        const t = trackersRef.current.find((x) => x.id === id);
        if (!t) return;
        const { error } = await saveTracker(id, t.tracker);
        if (error) toast.error(error);
    }, []);

    const touch = useCallback(
        (id: string) => {
            const old = timers.current.get(id);
            if (old) clearTimeout(old);
            timers.current.set(id, setTimeout(() => void saveOne(id), SAVE_DELAY));
        },
        [saveOne]
    );

    useEffect(() => {
        const pending = timers.current;
        const warn = (e: BeforeUnloadEvent) => {
            if (pending.size) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => {
            window.removeEventListener("beforeunload", warn);
            for (const [id, t] of pending) {
                clearTimeout(t);
                const tr = trackersRef.current.find((x) => x.id === id);
                if (tr) void saveTracker(id, tr.tracker);
            }
            pending.clear();
        };
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    const current = trackers.find((t) => t.id === currentId) ?? null;

    const editItems = (update: (items: TrackerItem[]) => TrackerItem[]) => {
        if (!current) return;
        setTrackers((prev) =>
            prev.map((t) => (t.id === current.id ? { ...t, tracker: { ...t.tracker, items: update(t.tracker.items) } } : t))
        );
        touch(current.id);
    };

    // ---------- Trackers ----------
    const open = (id: string) => {
        setCurrentId(id);
        setMobileOpen(true);
        setOpenItem(null);
        setSearch("");
        const url = new URL(window.location.href);
        url.searchParams.set("t", id);
        window.history.replaceState(null, "", url);
    };

    const createTracker = async () => {
        setCreating(true);
        const { error, id } = await createDriveFile("tracker", "Watchlist");
        setCreating(false);
        if (error || !id) return toast.error(error ?? "Couldn't create a tracker.");
        setTrackers((prev) => [
            ...prev,
            { id, title: "Watchlist", tracker: defaultTracker(), updatedAt: new Date().toISOString() },
        ]);
        open(id);
    };

    const rename = async (title: string) => {
        if (!current) return;
        const t = title.trim() || "Untitled tracker";
        setTrackers((prev) => prev.map((x) => (x.id === current.id ? { ...x, title: t } : x)));
        const { error } = await renameDriveFile(current.id, t);
        if (error) toast.error(error);
    };

    const setColor = (color: BoardColor) => {
        if (!current) return;
        setTrackers((prev) => prev.map((t) => (t.id === current.id ? { ...t, tracker: { ...t.tracker, color } } : t)));
        touch(current.id);
    };

    const remove = async () => {
        if (!current) return;
        const { error } = await deleteDriveFile(current.id);
        if (error) return toast.error(error);
        const rest = trackers.filter((t) => t.id !== current.id);
        setTrackers(rest);
        setCurrentId(rest[0]?.id ?? null);
        setConfirmDelete(false);
        setMobileOpen(false);
        router.refresh();
    };

    // ---------- Shows ----------
    const add = () => {
        const name = draft.trim();
        if (!name || !current) return;
        if (current.tracker.items.length >= TRACKER_LIMIT) return toast.error("This tracker is full.");
        const item = { ...newTrackerItem(name.slice(0, 200), Number(draftEp) || 0), status: (filter === "planned" ? "planned" : "watching") as TrackerStatus };
        editItems((items) => [item, ...items]);
        setDraft("");
        setDraftEp("");
        if (filter === "completed") setFilter("watching");
    };

    const importList = (text: string) => {
        const rows = parseTrackerList(text);
        if (!rows.length || !current) return;
        const room = TRACKER_LIMIT - current.tracker.items.length;
        const now = Date.now();
        // Keep the pasted order: the first line ends up on top.
        const items = rows.slice(0, room).map((r, i) => ({
            ...newTrackerItem(r.name.slice(0, 200), r.episode),
            updatedAt: new Date(now - i * 1000).toISOString(),
        }));
        editItems((existing) => [...items, ...existing]);
        setFilter("watching");
        setImportOpen(false);
        toast.success(`Added ${items.length} show${items.length === 1 ? "" : "s"}.`);
    };

    const counts = useMemo(() => {
        const items = current?.tracker.items ?? [];
        return {
            watching: items.filter((i) => i.status === "watching").length,
            planned: items.filter((i) => i.status === "planned").length,
            completed: items.filter((i) => i.status === "completed").length,
            all: items.length,
        };
    }, [current]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (current?.tracker.items ?? [])
            .filter((i) => (filter === "all" || i.status === filter) && (!q || i.name.toLowerCase().includes(q)))
            .sort((a, b) =>
                filter === "planned" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)
            );
    }, [current, filter, search]);

    const band = current ? BOARD_COLORS[current.tracker.color].band : "bg-black";
    // Newest change: a show you updated, or the tracker itself.
    const lastUpdated = current
        ? [current.updatedAt, ...current.tracker.items.map((i) => i.updatedAt)].sort().at(-1)
        : null;

    return (
        <div className="flex h-full w-full">
            {/* ---------- Sidebar ---------- */}
            <aside
                className={`${mobileOpen ? "hidden md:flex" : "flex"} w-full md:w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-100`}
            >
                <div className="px-4 pt-4 pb-2">
                    <Link href="/drive" className="flex w-fit items-center text-sm text-gray-600 hover:text-black">
                        <ChevronLeft className="size-4" /> Drive
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Trackers</h1>
                    <p className="text-xs text-gray-500">Shows, anime, anything with episodes.</p>
                </div>
                <nav className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
                    <ul className="space-y-0.5">
                        {trackers.map((t) => {
                            const watching = t.tracker.items.filter((i) => i.status === "watching").length;
                            return (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => open(t.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer ${
                                            t.id === currentId ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                        }`}
                                    >
                                        <span className={`size-3 rounded-full ${BOARD_COLORS[t.tracker.color].band}`} />
                                        <span className="flex-1 truncate text-left">{t.title || "Untitled tracker"}</span>
                                        {watching > 0 && <span className="text-xs text-gray-500">{watching}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <button
                        type="button"
                        onClick={createTracker}
                        disabled={creating}
                        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer"
                    >
                        {creating ? <Loader size={4} color="text-gray-600" /> : <Plus className="size-4" />} New tracker
                    </button>
                </nav>
            </aside>

            {/* ---------- Shows ---------- */}
            <main className={`${mobileOpen ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-white`}>
                {!current ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="rounded-2xl bg-violet-100 p-4 text-violet-700">
                            <Tv className="size-8" />
                        </div>
                        <p className="font-semibold">Track what you&apos;re watching</p>
                        <p className="max-w-sm text-sm text-gray-500">
                            Keep every show&apos;s episode in one place, and jump straight to the next one.
                        </p>
                        <Button onClick={createTracker} disabled={creating} className="cursor-pointer">
                            {creating ? <Loader size={4} color="text-white" /> : <Plus className="size-4" />} New tracker
                        </Button>
                    </div>
                ) : (
                    <>
                        <header className="flex items-center gap-2 px-4 pt-4 md:px-8 md:pt-6">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Back to trackers"
                                className="md:hidden rounded-md p-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <span className={`size-3 shrink-0 rounded-full ${band}`} />
                            <input
                                key={current.id}
                                defaultValue={current.title}
                                maxLength={200}
                                onBlur={(e) => e.target.value !== current.title && rename(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                                aria-label="Tracker name"
                                className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-2xl font-bold outline-none hover:bg-gray-50 focus:ring-2 focus:ring-black"
                            />
                            <div ref={menuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((o) => !o)}
                                    aria-label="Tracker options"
                                    className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer"
                                >
                                    <MoreHorizontal className="size-5" />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 top-10 z-20 w-52 rounded-lg bg-white p-2 text-sm shadow-lg ring-1 ring-black/10">
                                        <p className="px-2 pb-1 text-xs font-semibold text-gray-500">Colour</p>
                                        <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                                            {(Object.keys(BOARD_COLORS) as BoardColor[]).map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    aria-label={c}
                                                    onClick={() => setColor(c)}
                                                    className={`size-6 rounded-full cursor-pointer ${BOARD_COLORS[c].band} ${
                                                        current.tracker.color === c ? "ring-2 ring-black ring-offset-2" : ""
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setImportOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <ClipboardPaste className="size-4" /> Paste a list
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setConfirmDelete(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-600 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <Trash2 className="size-4" /> Delete tracker
                                        </button>
                                    </div>
                                )}
                            </div>
                        </header>
                        <div className="pl-[3.25rem] pr-4 md:pr-8">
                            <UpdatedAgo updated={lastUpdated} prefix="Last updated" />
                        </div>

                        {/* Add a show */}
                        <div className="px-4 pt-4 md:px-8">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black">
                                <Plus className="size-4 shrink-0 text-gray-500" />
                                <input
                                    value={draft}
                                    maxLength={200}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && add()}
                                    placeholder="Add a show"
                                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                                />
                                {draft && (
                                    <>
                                        <input
                                            type="number"
                                            min={0}
                                            value={draftEp}
                                            onChange={(e) => setDraftEp(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && add()}
                                            placeholder="Ep"
                                            aria-label="Episode you're on"
                                            className="w-16 rounded-md bg-white px-2 py-1 text-sm ring-1 ring-black/10 outline-none"
                                        />
                                        <Button size="sm" className="h-7 cursor-pointer" onClick={add}>
                                            Add
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Filters + search */}
                        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 md:px-8">
                            <div className="scroll-thin flex max-w-full gap-1 overflow-x-auto">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFilter(f.id)}
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                                            filter === f.id ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {f.label} <span className="opacity-60">{counts[f.id]}</span>
                                    </button>
                                ))}
                            </div>
                            {counts.all > 6 && (
                                <label className="ml-auto flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                                    <Search className="size-3.5 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search"
                                        className="w-28 bg-transparent text-xs outline-none"
                                    />
                                    {search && (
                                        <button type="button" onClick={() => setSearch("")} aria-label="Clear" className="cursor-pointer">
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </label>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 md:px-8 md:pb-8">
                            {shown.length ? (
                                <ul className="space-y-2">
                                    {shown.map((item) => (
                                        <ShowRow
                                            key={item.id}
                                            item={item}
                                            band={band}
                                            open={openItem === item.id}
                                            onToggleOpen={() => setOpenItem((o) => (o === item.id ? null : item.id))}
                                            onChange={(next) => editItems((items) => items.map((i) => (i.id === next.id ? next : i)))}
                                            onDelete={() => editItems((items) => items.filter((i) => i.id !== item.id))}
                                        />
                                    ))}
                                </ul>
                            ) : counts.all === 0 ? (
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
                                    Add your first show above.
                                    <button
                                        type="button"
                                        onClick={() => setImportOpen(true)}
                                        className="flex items-center gap-1.5 font-semibold text-black hover:underline cursor-pointer"
                                    >
                                        <ClipboardPaste className="size-4" /> Or paste your list
                                    </button>
                                </div>
                            ) : (
                                <p className="py-10 text-center text-sm text-gray-500">Nothing here.</p>
                            )}
                        </div>
                    </>
                )}
            </main>

            {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImport={importList} />}

            <ConfirmModal
                isPending={false}
                open={confirmDelete}
                title="Delete this tracker?"
                text="All its shows are deleted too."
                confirmText="Delete"
                onConfirm={remove}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    );
}

/** Paste lines like "Swallowed Star: 242" to add many shows at once. */
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (text: string) => void }) {
    const [text, setText] = useState("");
    const rows = parseTrackerList(text);

    return (
        <Modal open onClose={onClose}>
            <div className="w-[min(92vw,480px)] space-y-3 rounded-xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ClipboardPaste className="size-4" /> Paste a list
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-gray-100 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>
                <p className="text-xs text-gray-500">One show per line. Put the episode at the end, like &ldquo;Swallowed Star: 242&rdquo;.</p>
                <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    placeholder={"Swallowed Star: 242\nSoul Land 1: 364\nLink Click"}
                    className="w-full resize-none rounded-lg p-3 font-mono text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                />
                {rows.length > 0 && (
                    <ul className="scroll-thin max-h-40 space-y-0.5 overflow-y-auto rounded-lg bg-gray-50 p-2 text-xs">
                        {rows.map((r, i) => (
                            <li key={i} className="flex justify-between gap-2">
                                <span className="truncate">{r.name}</span>
                                <span className="shrink-0 tabular-nums text-gray-500">{r.episode ? `ep ${r.episode}` : "not started"}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button size="sm" disabled={!rows.length} onClick={() => onImport(text)} className="cursor-pointer">
                        Add {rows.length || ""} show{rows.length === 1 ? "" : "s"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
