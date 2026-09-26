"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, isToday } from "date-fns";
import { ChevronLeft, Pin, PinOff, Search, SquarePen, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/general/ConfirmModal";
import Loader from "@/components/general/Loader";
import {
    createDriveFile,
    deleteDriveFile,
    saveNote,
    setDriveFilePinned,
    type NoteData,
} from "@/actions/drive/drive";
import { MAX_NOTE_CHARS, notePreview, splitNote } from "@/lib/drive";

type Props = { initialNotes: NoteData[]; initialId?: string | null };
type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY = 600;

// Removing an empty note on leave waits a moment, so React's dev-mode
// "mount twice" check doesn't delete a note you just created.
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

function sortNotes(list: NoteData[]) {
    return [...list].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)
    );
}

function groupFor(note: NoteData) {
    if (note.pinned) return "Pinned";
    const d = new Date(note.updatedAt);
    if (isToday(d)) return "Today";
    const days = differenceInCalendarDays(new Date(), d);
    if (days <= 7) return "Previous 7 days";
    if (days <= 30) return "Previous 30 days";
    return format(d, "MMMM yyyy");
}

/** Apple Notes style: list on the left, the note on the right, saves as you type. */
export default function NotesApp({ initialNotes, initialId }: Props) {
    const [notes, setNotes] = useState(() => sortNotes(initialNotes));
    const [selectedId, setSelectedId] = useState<string | null>(
        initialId && initialNotes.some((n) => n.id === initialId) ? initialId : null
    );
    const [query, setQuery] = useState("");
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [creating, setCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const timers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; text: string }>());
    const notesRef = useRef(notes);
    const selectedRef = useRef(selectedId);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        notesRef.current = notes;
        selectedRef.current = selectedId;
    }, [notes, selectedId]);

    const selected = notes.find((n) => n.id === selectedId) ?? null;

    // ---------- Saving ----------
    const flush = async (id: string) => {
        const pending = timers.current.get(id);
        if (!pending) return;
        clearTimeout(pending.timer);
        timers.current.delete(id);
        setSaveState("saving");
        const { error } = await saveNote(id, pending.text);
        setSaveState(error ? "error" : timers.current.size ? "saving" : "saved");
        if (error) toast.error("Couldn't save your note.");
    };

    const updateText = (id: string, text: string) => {
        const clean = text.slice(0, MAX_NOTE_CHARS);
        const now = new Date().toISOString();
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: clean, updatedAt: now } : n)));
        const old = timers.current.get(id);
        if (old) clearTimeout(old.timer);
        timers.current.set(id, { text: clean, timer: setTimeout(() => void flush(id), SAVE_DELAY) });
        setSaveState("saving");
    };

    // Save everything (and drop an empty note) when leaving the page.
    useEffect(() => {
        if (leaveTimer) clearTimeout(leaveTimer);
        const pendingTimers = timers.current;
        const warn = (e: BeforeUnloadEvent) => {
            if (pendingTimers.size) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => {
            window.removeEventListener("beforeunload", warn);
            for (const [id, p] of pendingTimers) {
                clearTimeout(p.timer);
                void saveNote(id, p.text);
            }
            pendingTimers.clear();
            const current = notesRef.current.find((n) => n.id === selectedRef.current);
            if (current && !current.text.trim()) {
                leaveTimer = setTimeout(() => void deleteDriveFile(current.id), 500);
            }
        };
    }, []);

    // ---------- Selecting ----------
    const setUrl = (id: string | null) => {
        const url = new URL(window.location.href);
        if (id) url.searchParams.set("n", id);
        else url.searchParams.delete("n");
        window.history.replaceState(null, "", url);
    };

    /** Leaving a note you didn't type anything in removes it, like Apple Notes. */
    const leaveCurrent = (nextId: string | null) => {
        const current = notes.find((n) => n.id === selectedId);
        if (!current || current.id === nextId) return;
        if (!current.text.trim()) {
            const pending = timers.current.get(current.id);
            if (pending) clearTimeout(pending.timer);
            timers.current.delete(current.id);
            setNotes((prev) => prev.filter((n) => n.id !== current.id));
            void deleteDriveFile(current.id);
        } else {
            void flush(current.id);
        }
    };

    const select = (id: string | null) => {
        leaveCurrent(id);
        setSelectedId(id);
        setUrl(id);
    };

    const newNote = async () => {
        if (selected && !selected.text.trim()) return titleRef.current?.focus();
        setCreating(true);
        const { error, id } = await createDriveFile("note");
        setCreating(false);
        if (error || !id) return toast.error(error ?? "Couldn't create a note.");
        const now = new Date().toISOString();
        leaveCurrent(id);
        setNotes((prev) => sortNotes([{ id, text: "", pinned: false, createdAt: now, updatedAt: now }, ...prev]));
        setSelectedId(id);
        setUrl(id);
        setQuery("");
        setTimeout(() => titleRef.current?.focus(), 0);
    };

    const togglePin = async () => {
        if (!selected) return;
        const pinned = !selected.pinned;
        setNotes((prev) => sortNotes(prev.map((n) => (n.id === selected.id ? { ...n, pinned } : n))));
        const { error } = await setDriveFilePinned(selected.id, pinned);
        if (error) toast.error(error);
    };

    const remove = async () => {
        if (!selected) return;
        const id = selected.id;
        const pending = timers.current.get(id);
        if (pending) clearTimeout(pending.timer);
        timers.current.delete(id);
        setConfirmDelete(false);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setSelectedId(null);
        setUrl(null);
        const { error } = await deleteDriveFile(id);
        if (error) toast.error(error);
        else toast.success("Note deleted.");
    };

    // ---------- List ----------
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? notes.filter((n) => n.text.toLowerCase().includes(q)) : notes;
    }, [notes, query]);

    const groups = useMemo(() => {
        const out: { name: string; items: NoteData[] }[] = [];
        for (const n of visible) {
            const name = groupFor(n);
            const last = out[out.length - 1];
            if (last?.name === name) last.items.push(n);
            else out.push({ name, items: [n] });
        }
        return out;
    }, [visible]);

    const { title, body } = splitNote(selected?.text ?? "");
    const setTitle = (t: string) => selected && updateText(selected.id, body ? `${t.replace(/\n/g, " ")}\n${body}` : t);
    const setBody = (b: string) => selected && updateText(selected.id, b ? `${title}\n${b}` : title);

    return (
        <div className="flex h-full w-full">
            {/* ---------- Note list ---------- */}
            <aside
                className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 shrink-0 flex-col border-r border-gray-200 bg-gray-100`}
            >
                <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                    <Link href="/drive" className="flex items-center text-sm text-gray-600 hover:text-black">
                        <ChevronLeft className="size-4" /> Drive
                    </Link>
                    <button
                        type="button"
                        onClick={newNote}
                        disabled={creating}
                        aria-label="New note"
                        title="New note"
                        className="rounded-md p-1.5 text-amber-600 hover:bg-gray-200 cursor-pointer"
                    >
                        {creating ? <Loader size={5} color="text-amber-600" /> : <SquarePen className="size-5" />}
                    </button>
                </div>
                <div className="px-4 pb-3">
                    <h1 className="text-2xl font-bold">Notes</h1>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-1.5">
                        <Search className="size-4 text-gray-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
                    {groups.map((g) => (
                        <div key={g.name} className="mb-3">
                            <p className="px-2 pb-1 text-xs font-semibold text-gray-500">{g.name}</p>
                            <ul className="rounded-xl bg-white/60">
                                {g.items.map((n, i) => {
                                    const d = new Date(n.updatedAt);
                                    const active = n.id === selectedId;
                                    return (
                                        <li key={n.id}>
                                            <button
                                                type="button"
                                                onClick={() => select(n.id)}
                                                className={`w-full rounded-lg px-3 py-2.5 text-left cursor-pointer ${
                                                    active ? "bg-amber-200/70" : "hover:bg-gray-200/70"
                                                }`}
                                            >
                                                <p className="truncate text-sm font-semibold">
                                                    {splitNote(n.text).title.trim() || "New note"}
                                                </p>
                                                <p className="truncate text-xs text-gray-500">
                                                    <span className="text-gray-700">
                                                        {isToday(d) ? format(d, "h:mm a") : format(d, "dd/MM/yyyy")}
                                                    </span>{" "}
                                                    {notePreview(n.text) || "No additional text"}
                                                </p>
                                            </button>
                                            {i < g.items.length - 1 && !active && (
                                                <div className="mx-3 border-b border-gray-200" />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {!visible.length && (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-gray-500">
                            <StickyNote className="size-8 text-gray-300" />
                            {query ? "No matching notes." : "No notes yet."}
                            {!query && (
                                <button type="button" onClick={newNote} className="font-semibold text-black hover:underline cursor-pointer">
                                    Write your first note
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <p className="hidden md:block border-t border-gray-200 py-2 text-center text-xs text-gray-500">
                    {notes.length} note{notes.length === 1 ? "" : "s"}
                </p>
            </aside>

            {/* ---------- Editor ---------- */}
            <main className={`${selected ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col bg-white`}>
                {selected ? (
                    <>
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                            <button
                                type="button"
                                onClick={() => select(null)}
                                className="md:hidden flex items-center text-amber-600 cursor-pointer"
                            >
                                <ChevronLeft className="size-5" /> Notes
                            </button>
                            <span className="flex-1 text-xs text-gray-400 text-center md:text-left md:pl-2">
                                {saveState === "saving" ? "Saving..." : saveState === "error" ? "Not saved" : "Saved"}
                            </span>
                            <button
                                type="button"
                                onClick={togglePin}
                                aria-label={selected.pinned ? "Unpin note" : "Pin note"}
                                title={selected.pinned ? "Unpin" : "Pin"}
                                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                                {selected.pinned ? <PinOff className="size-4.5" /> : <Pin className="size-4.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                aria-label="Delete note"
                                title="Delete"
                                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                            >
                                <Trash2 className="size-4.5" />
                            </button>
                            <button
                                type="button"
                                onClick={newNote}
                                aria-label="New note"
                                title="New note"
                                className="md:hidden rounded-md p-1.5 text-amber-600 hover:bg-gray-100 cursor-pointer"
                            >
                                <SquarePen className="size-4.5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="mx-auto w-full max-w-3xl px-5 md:px-10 py-6 pb-28 md:pb-10">
                                <p className="mb-4 text-center text-xs text-gray-400">
                                    {format(new Date(selected.updatedAt), "d MMMM yyyy 'at' h:mm a")}
                                </p>
                                <input
                                    ref={titleRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            bodyRef.current?.focus();
                                            bodyRef.current?.setSelectionRange(0, 0);
                                        }
                                    }}
                                    placeholder="Title"
                                    className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-gray-300"
                                />
                                <textarea
                                    ref={bodyRef}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Backspace at the very start jumps back to the title.
                                        const t = e.currentTarget;
                                        if (e.key === "Backspace" && t.selectionStart === 0 && t.selectionEnd === 0) {
                                            e.preventDefault();
                                            titleRef.current?.focus();
                                        }
                                    }}
                                    placeholder="Start writing..."
                                    className="mt-3 w-full min-h-[60vh] resize-none bg-transparent text-[15px] leading-relaxed outline-none field-sizing-content placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-500">
                        <StickyNote className="size-10 text-gray-300" />
                        Pick a note, or start a new one.
                        <button
                            type="button"
                            onClick={newNote}
                            disabled={creating}
                            className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 font-semibold text-white cursor-pointer"
                        >
                            <SquarePen className="size-4" /> New note
                        </button>
                    </div>
                )}
            </main>

            <ConfirmModal
                isPending={false}
                open={confirmDelete}
                title="Delete this note?"
                text="This can't be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={remove}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    );
}
