"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    CalendarDays,
    CalendarRange,
    ChevronDown,
    ChevronLeft,
    ListTodo,
    MoreHorizontal,
    Plus,
    Star,
    Sun,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/general/ConfirmModal";
import Loader from "@/components/general/Loader";
import {
    createDriveFile,
    deleteDriveFile,
    renameDriveFile,
    saveTodoList,
    type TodoListData,
} from "@/actions/drive/drive";
import {
    BOARD_COLORS,
    TODO_LIMIT,
    dayKey,
    defaultTodoList,
    newTodo,
    todayKey,
    type BoardColor,
    type Todo,
} from "@/lib/drive";
import TodoRow, { dueText } from "./TodoRow";

type SmartView = "today" | "upcoming" | "important";
type View = { kind: "smart"; id: SmartView } | { kind: "list"; id: string };
type Row = { todo: Todo; listId: string };

const SMART = [
    { id: "today" as const, label: "Today", icon: Sun, tint: "text-amber-500" },
    { id: "upcoming" as const, label: "Upcoming", icon: CalendarRange, tint: "text-sky-600" },
    { id: "important" as const, label: "Important", icon: Star, tint: "text-rose-500" },
];

const SAVE_DELAY = 600;

/** Microsoft To Do style: smart views and your lists on the left, tasks on the right. */
export default function TodosApp({ initialLists, initialListId }: { initialLists: TodoListData[]; initialListId?: string | null }) {
    const [lists, setLists] = useState(initialLists);
    const [view, setView] = useState<View | null>(() =>
        initialListId && initialLists.some((l) => l.id === initialListId)
            ? { kind: "list", id: initialListId }
            : { kind: "smart", id: "today" }
    );
    const [mobileOpen, setMobileOpen] = useState(!!initialListId);
    const [draft, setDraft] = useState("");
    const [draftDue, setDraftDue] = useState<string | null>(null);
    const [showDone, setShowDone] = useState(false);
    const [creating, setCreating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const listsRef = useRef(lists);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listsRef.current = lists;
    }, [lists]);

    // ---------- Saving (each list saves on its own, shortly after a change) ----------
    const saveList = useCallback(async (id: string) => {
        timers.current.delete(id);
        const list = listsRef.current.find((l) => l.id === id);
        if (!list) return;
        const { error } = await saveTodoList(id, list.list);
        if (error) toast.error(error);
    }, []);

    const touch = useCallback(
        (id: string) => {
            const old = timers.current.get(id);
            if (old) clearTimeout(old);
            timers.current.set(id, setTimeout(() => void saveList(id), SAVE_DELAY));
        },
        [saveList]
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
                const list = listsRef.current.find((l) => l.id === id);
                if (list) void saveTodoList(id, list.list);
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

    const editItems = (listId: string, update: (items: Todo[]) => Todo[]) => {
        setLists((prev) =>
            prev.map((l) => (l.id === listId ? { ...l, list: { ...l.list, items: update(l.list.items) } } : l))
        );
        touch(listId);
    };

    const changeTodo = (listId: string, todo: Todo) =>
        editItems(listId, (items) => items.map((t) => (t.id === todo.id ? todo : t)));
    const deleteTodo = (listId: string, todoId: string) =>
        editItems(listId, (items) => items.filter((t) => t.id !== todoId));

    // ---------- Lists ----------
    const openView = (v: View) => {
        setView(v);
        setMobileOpen(true);
        setShowDone(false);
        setDraftDue(null);
        const url = new URL(window.location.href);
        if (v.kind === "list") url.searchParams.set("list", v.id);
        else url.searchParams.delete("list");
        window.history.replaceState(null, "", url);
    };

    const createList = async (title = "New list") => {
        setCreating(true);
        const { error, id } = await createDriveFile("todo", title);
        setCreating(false);
        if (error || !id) {
            toast.error(error ?? "Couldn't create a list.");
            return null;
        }
        const created: TodoListData = { id, title, list: defaultTodoList(), updatedAt: new Date().toISOString() };
        setLists((prev) => [...prev, created]);
        return created;
    };

    const current = view?.kind === "list" ? lists.find((l) => l.id === view.id) ?? null : null;

    const renameList = async (title: string) => {
        if (!current) return;
        const t = title.trim() || "Untitled list";
        setLists((prev) => prev.map((l) => (l.id === current.id ? { ...l, title: t } : l)));
        const { error } = await renameDriveFile(current.id, t);
        if (error) toast.error(error);
    };

    const setColor = (color: BoardColor) => {
        if (!current) return;
        setLists((prev) => prev.map((l) => (l.id === current.id ? { ...l, list: { ...l.list, color } } : l)));
        touch(current.id);
    };

    const removeList = async () => {
        if (!current) return;
        const id = current.id;
        setConfirmDelete(false);
        const t = timers.current.get(id);
        if (t) clearTimeout(t);
        timers.current.delete(id);
        setLists((prev) => prev.filter((l) => l.id !== id));
        openView({ kind: "smart", id: "today" });
        const { error } = await deleteDriveFile(id);
        if (error) toast.error(error);
        else toast.success("List deleted.");
    };

    // ---------- What to show ----------
    const today = todayKey();
    const all: Row[] = useMemo(
        () => lists.flatMap((l) => l.list.items.map((todo) => ({ todo, listId: l.id }))),
        [lists]
    );
    const counts = useMemo(
        () => ({
            today: all.filter((r) => !r.todo.done && r.todo.due && r.todo.due <= today).length,
            upcoming: all.filter((r) => !r.todo.done && r.todo.due && r.todo.due > today).length,
            important: all.filter((r) => !r.todo.done && r.todo.important).length,
        }),
        [all, today]
    );

    const rows: Row[] = useMemo(() => {
        if (!view) return [];
        if (view.kind === "list") return all.filter((r) => r.listId === view.id);
        if (view.id === "today") return all.filter((r) => r.todo.due && r.todo.due <= today);
        if (view.id === "upcoming")
            return all.filter((r) => r.todo.due && r.todo.due > today).sort((a, b) => a.todo.due!.localeCompare(b.todo.due!));
        return all.filter((r) => r.todo.important);
    }, [all, view, today]);

    const open = rows.filter((r) => !r.todo.done);
    const done = rows
        .filter((r) => r.todo.done)
        .sort((a, b) => (b.todo.doneAt ?? "").localeCompare(a.todo.doneAt ?? ""));

    // "Upcoming" is grouped by day; "Today" puts overdue first.
    const groups = useMemo(() => {
        if (view?.kind === "smart" && view.id === "upcoming") {
            const out: { name: string; rows: Row[] }[] = [];
            for (const r of open) {
                const name = dueText(r.todo.due!);
                const last = out[out.length - 1];
                if (last?.name === name) last.rows.push(r);
                else out.push({ name, rows: [r] });
            }
            return out;
        }
        if (view?.kind === "smart" && view.id === "today") {
            const overdue = open.filter((r) => r.todo.due! < today);
            const due = open.filter((r) => r.todo.due === today);
            return [
                ...(overdue.length ? [{ name: "Overdue", rows: overdue }] : []),
                ...(due.length ? [{ name: overdue.length ? "Today" : "", rows: due }] : []),
            ];
        }
        return [{ name: "", rows: open }];
    }, [open, view, today]);

    // ---------- Adding ----------
    const add = async () => {
        const text = draft.trim();
        if (!text || !view) return;
        // In a smart view, new tasks go to your first list (made for you if needed).
        let target: TodoListData | null = current ?? lists[0] ?? null;
        if (!target) target = await createList("Tasks");
        if (!target) return;
        if (target.list.items.length >= TODO_LIMIT) return toast.error("This list is full.");

        const due =
            draftDue ?? (view.kind === "smart" ? (view.id === "today" ? today : view.id === "upcoming" ? dayKey(1) : null) : null);
        const todo = { ...newTodo(text.slice(0, 500), due), important: view.kind === "smart" && view.id === "important" };
        editItems(target.id, (items) => [todo, ...items]);
        setDraft("");
    };

    const title =
        view?.kind === "list" ? current?.title ?? "" : SMART.find((s) => view && s.id === view.id)?.label ?? "";
    const headerColor = current ? BOARD_COLORS[current.list.color].band : "bg-black";
    const listMeta = (id: string) => lists.find((l) => l.id === id);
    const showListName = view?.kind === "smart";

    return (
        <div className="flex h-full w-full">
            {/* ---------- Sidebar ---------- */}
            <aside
                className={`${mobileOpen ? "hidden md:flex" : "flex"} w-full md:w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-100`}
            >
                <div className="px-4 pt-4 pb-2">
                    <Link href="/productivity" className="flex w-fit items-center text-sm text-gray-600 hover:text-black">
                        <ChevronLeft className="size-4" /> Productivity
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">To-dos</h1>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
                    <ul className="space-y-0.5">
                        {SMART.map((s) => {
                            const active = view?.kind === "smart" && view.id === s.id;
                            return (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => openView({ kind: "smart", id: s.id })}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer ${
                                            active ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                        }`}
                                    >
                                        <s.icon className={`size-4.5 ${s.tint}`} />
                                        <span className="flex-1 text-left">{s.label}</span>
                                        {counts[s.id] > 0 && <span className="text-xs text-gray-500">{counts[s.id]}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="my-3 border-t border-gray-300" />
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">My lists</p>
                    <ul className="space-y-0.5">
                        {lists.map((l) => {
                            const active = view?.kind === "list" && view.id === l.id;
                            const openCount = l.list.items.filter((t) => !t.done).length;
                            return (
                                <li key={l.id}>
                                    <button
                                        type="button"
                                        onClick={() => openView({ kind: "list", id: l.id })}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer ${
                                            active ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                        }`}
                                    >
                                        <span className={`size-3 rounded-full ${BOARD_COLORS[l.list.color].band}`} />
                                        <span className="flex-1 truncate text-left">{l.title || "Untitled list"}</span>
                                        {openCount > 0 && <span className="text-xs text-gray-500">{openCount}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <button
                        type="button"
                        onClick={async () => {
                            const created = await createList();
                            if (created) openView({ kind: "list", id: created.id });
                        }}
                        disabled={creating}
                        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer"
                    >
                        {creating ? <Loader size={4} color="text-gray-600" /> : <Plus className="size-4" />} New list
                    </button>
                </nav>
            </aside>

            {/* ---------- Tasks ---------- */}
            <main className={`${mobileOpen ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-white`}>
                <header className="flex items-center gap-2 px-4 md:px-8 pt-4 md:pt-6">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Back to lists"
                        className="md:hidden rounded-md p-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <span className={`size-3 shrink-0 rounded-full ${headerColor}`} />
                    {current ? (
                        <input
                            key={current.id}
                            defaultValue={current.title}
                            maxLength={200}
                            onBlur={(e) => e.target.value !== current.title && renameList(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            aria-label="List name"
                            className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-2xl font-bold outline-none hover:bg-gray-50 focus:ring-2 focus:ring-black"
                        />
                    ) : (
                        <h2 className="flex-1 text-2xl font-bold">{title}</h2>
                    )}
                    {current && (
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-label="List options"
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
                                                    current.list.color === c ? "ring-2 ring-black ring-offset-2" : ""
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            setConfirmDelete(true);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-600 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <Trash2 className="size-4" /> Delete list
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </header>
                {view?.kind === "smart" && view.id === "today" && (
                    <p className="px-4 md:px-8 text-sm text-gray-500">
                        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                )}

                {/* Add a task */}
                <div className="px-4 md:px-8 pt-4">
                    <div className="rounded-lg bg-gray-100 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black">
                        <div className="flex items-center gap-2 px-3">
                            <Plus className="size-4 text-gray-500" />
                            <input
                                value={draft}
                                maxLength={500}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && add()}
                                placeholder="Add a task"
                                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                            />
                        </div>
                        {draft && (
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-200 px-3 py-2">
                                <CalendarDays className="size-4 text-gray-500" />
                                {[
                                    { label: "Today", value: today },
                                    { label: "Tomorrow", value: dayKey(1) },
                                    { label: "Next week", value: dayKey(7) },
                                ].map((o) => (
                                    <button
                                        key={o.label}
                                        type="button"
                                        onClick={() => setDraftDue(draftDue === o.value ? null : o.value)}
                                        className={`rounded-md px-2 py-0.5 text-xs ring-1 cursor-pointer ${
                                            draftDue === o.value ? "bg-black text-white ring-black" : "ring-gray-300 hover:bg-white"
                                        }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                                <input
                                    type="date"
                                    value={draftDue ?? ""}
                                    onChange={(e) => setDraftDue(e.target.value || null)}
                                    className="rounded-md bg-white px-2 py-0.5 text-xs ring-1 ring-gray-300 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={add}
                                    className="ml-auto rounded-md bg-black px-3 py-1 text-xs font-semibold text-white cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-28 md:pb-8">
                    {groups.map((g, gi) => (
                        <div key={g.name || gi} className="mb-4">
                            {g.name && (
                                <p
                                    className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                                        g.name === "Overdue" ? "text-red-600" : "text-gray-500"
                                    }`}
                                >
                                    {g.name}
                                </p>
                            )}
                            <ul className="space-y-1.5">
                                {g.rows.map((r) => {
                                    const meta = listMeta(r.listId);
                                    return (
                                        <TodoRow
                                            key={r.todo.id}
                                            todo={r.todo}
                                            listName={showListName ? meta?.title : undefined}
                                            listColor={meta?.list.color}
                                            onChange={(t) => changeTodo(r.listId, t)}
                                            onDelete={() => deleteTodo(r.listId, r.todo.id)}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {!open.length && (
                        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-gray-500">
                            <ListTodo className="size-10 text-gray-300" />
                            {view?.kind === "smart" && view.id === "today"
                                ? "Nothing due today. Enjoy it."
                                : view?.kind === "smart" && view.id === "upcoming"
                                  ? "Nothing scheduled yet. Give a task a date and it shows up here."
                                  : view?.kind === "smart"
                                    ? "Star a task to see it here."
                                    : "All clear. Add a task above."}
                        </div>
                    )}

                    {done.length > 0 && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setShowDone((s) => !s)}
                                className="mb-2 flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-semibold text-gray-600 hover:text-black cursor-pointer"
                            >
                                <ChevronDown className={`size-4 transition-transform ${showDone ? "" : "-rotate-90"}`} />
                                Completed {done.length}
                            </button>
                            {showDone && (
                                <ul className="space-y-1.5">
                                    {done.map((r) => {
                                        const meta = listMeta(r.listId);
                                        return (
                                            <TodoRow
                                                key={r.todo.id}
                                                todo={r.todo}
                                                listName={showListName ? meta?.title : undefined}
                                                listColor={meta?.list.color}
                                                onChange={(t) => changeTodo(r.listId, t)}
                                                onDelete={() => deleteTodo(r.listId, r.todo.id)}
                                            />
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                isPending={false}
                open={confirmDelete}
                title="Delete this list?"
                text="All its tasks will be deleted. This can't be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={removeList}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    );
}
