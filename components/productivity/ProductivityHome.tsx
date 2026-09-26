"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarClock, Kanban, ListTodo, Plus, Sun } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import SeeAll from "@/components/general/SeeAll";
import { createDriveFile } from "@/actions/drive/drive";
import { BOARD_COLORS, dayKey, formatTime, todayKey, type DriveFileSummary, type DueItem } from "@/lib/drive";
import { dueText } from "./todos/TodoRow";
import { useCreatePlanner } from "./planner/useCreatePlanner";
import { PlannerTile, TodoListTile } from "./Tiles";

type Props = { planners: DriveFileSummary[]; todoLists: DriveFileSummary[]; due: DueItem[] };

export default function ProductivityHome({ planners, todoLists, due }: Props) {
    const router = useRouter();
    const [creating, setCreating] = useState<"planner" | "todo" | null>(null);
    const planner = useCreatePlanner();

    const create = async (type: "planner" | "todo") => {
        if (type === "planner") return planner.create();
        setCreating(type);
        const { error, id } = await createDriveFile(type);
        if (error || !id) {
            setCreating(null);
            return toast.error(error ?? "Couldn't create it.");
        }
        router.push(`/productivity/todos?list=${id}`);
    };

    // Coming up: overdue, today, tomorrow, then the next two weeks by day.
    const groups = useMemo(() => {
        const today = todayKey();
        const out: { name: string; tone: string; items: DueItem[] }[] = [];
        for (const item of due) {
            const name = item.due < today ? "Overdue" : dueText(item.due);
            const tone = item.due < today ? "text-red-600" : item.due === today ? "text-amber-600" : "text-gray-500";
            const last = out[out.length - 1];
            if (last?.name === name) last.items.push(item);
            else out.push({ name, tone, items: [item] });
        }
        return out;
    }, [due]);

    const todayCount = due.filter((d) => d.due <= todayKey()).length;
    const weekCount = due.filter((d) => d.due <= dayKey(7)).length;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-8">
            <header className="flex items-center gap-3">
                <div className="rounded-xl bg-black p-2.5 text-white">
                    <CalendarCheck className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold leading-tight">Productivity</h1>
                    <p className="text-sm text-gray-500">Planners and to-dos, all on real dates. Only you can see them.</p>
                </div>
            </header>

            {/* Quick actions */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                    href="/productivity/todos"
                    className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100 hover:bg-amber-100 transition-colors"
                >
                    <span className="rounded-lg bg-amber-100 p-2 text-amber-600">
                        <Sun className="size-5" />
                    </span>
                    <span>
                        <span className="block font-semibold">My day</span>
                        <span className="block text-xs text-gray-600">
                            {todayCount ? `${todayCount} due today or overdue` : "Nothing due today"}
                        </span>
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={() => create("planner")}
                    disabled={!!creating}
                    className="flex items-center gap-3 rounded-xl bg-gray-100 p-4 text-left hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                >
                    <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
                        {planner.creating ? <Loader size={5} color="text-sky-700" /> : <Kanban className="size-5" />}
                    </span>
                    <span>
                        <span className="flex items-center gap-1 font-semibold">
                            <Plus className="size-3.5" /> Planner
                        </span>
                        <span className="block text-xs text-gray-500">Board and calendar for a project or schedule</span>
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => create("todo")}
                    disabled={!!creating}
                    className="flex items-center gap-3 rounded-xl bg-gray-100 p-4 text-left hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                >
                    <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                        {creating === "todo" ? <Loader size={5} color="text-emerald-700" /> : <ListTodo className="size-5" />}
                    </span>
                    <span>
                        <span className="flex items-center gap-1 font-semibold">
                            <Plus className="size-3.5" /> To-do list
                        </span>
                        <span className="block text-xs text-gray-500">A simple checklist with due dates</span>
                    </span>
                </button>
            </section>

            {/* Coming up */}
            <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <CalendarClock className="size-5" /> Coming up
                    {weekCount > 0 && <span className="text-sm font-normal text-gray-500">{weekCount} this week</span>}
                </h2>
                {groups.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-gray-100 p-4">
                        {groups.map((g) => (
                            <div key={g.name}>
                                <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${g.tone}`}>{g.name}</p>
                                <ul className="space-y-1">
                                    {g.items.map((item) => (
                                        <li key={`${item.kind}-${item.id}`}>
                                            <Link
                                                href={
                                                    item.kind === "card"
                                                        ? `/productivity/planners/${item.fileId}?view=calendar`
                                                        : `/productivity/todos?list=${item.fileId}`
                                                }
                                                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:ring-black/20"
                                            >
                                                <span className={`size-2 shrink-0 rounded-full ${BOARD_COLORS[item.color].band}`} />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.time && (
                                                        <span className="mr-1.5 font-semibold tabular-nums">{formatTime(item.time)}</span>
                                                    )}
                                                    {item.title}
                                                </span>
                                                <span className="shrink-0 text-xs text-gray-400 flex items-center gap-1">
                                                    {item.kind === "card" ? <Kanban className="size-3" /> : <ListTodo className="size-3" />}
                                                    <span className="max-w-28 truncate">{item.fileTitle}</span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                        Nothing due in the next two weeks. Give a card or task a due date and it shows up here.
                    </p>
                )}
            </section>

            {/* Planners */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Kanban className="size-5" /> Planners
                    </h2>
                    {planners.length > 0 && (
                        <SeeAll href="/productivity/planners" />
                    )}
                </div>
                {planners.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {planners.map((p) => (
                            <PlannerTile key={p.id} planner={p} />
                        ))}
                    </div>
                ) : (
                    <Empty text="No planners yet." action="New planner" onClick={() => create("planner")} />
                )}
            </section>

            {/* To-do lists */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <ListTodo className="size-5" /> To-do lists
                    </h2>
                    <SeeAll href="/productivity/todos" label="Open to-dos" />
                </div>
                {todoLists.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {todoLists.map((l) => (
                            <TodoListTile key={l.id} list={l} />
                        ))}
                    </div>
                ) : (
                    <Empty text="No to-do lists yet." action="New to-do list" onClick={() => create("todo")} />
                )}
            </section>
        </div>
    );
}

function Empty({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 text-sm text-gray-500">
            {text}
            <button type="button" onClick={onClick} className="font-semibold text-black hover:underline cursor-pointer">
                {action}
            </button>
        </div>
    );
}
