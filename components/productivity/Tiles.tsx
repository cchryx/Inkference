"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Kanban, ListTodo } from "lucide-react";
import { BOARD_COLORS, type DriveFileSummary } from "@/lib/drive";

export function PlannerTile({ planner }: { planner: DriveFileSummary }) {
    const color = BOARD_COLORS[planner.color ?? "slate"];
    const s = planner.stats;
    return (
        <Link
            href={`/productivity/planners/${planner.id}`}
            className="group overflow-hidden rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
            <div className={`h-14 ${color.band} relative`}>
                <Kanban className="absolute right-3 top-3 size-5 text-white/70" />
            </div>
            <div className="p-4">
                <p className="font-semibold truncate">{planner.title || "Untitled planner"}</p>
                <p className="mt-1 text-xs text-gray-500">
                    {s ? `${s.cards} card${s.cards === 1 ? "" : "s"} · ${s.lists} list${s.lists === 1 ? "" : "s"}` : ""}
                    {s && s.overdue > 0 && <span className="text-red-600"> · {s.overdue} overdue</span>}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                    Edited {formatDistanceToNow(new Date(planner.updatedAt), { addSuffix: true })}
                </p>
            </div>
        </Link>
    );
}

export function TodoListTile({ list }: { list: DriveFileSummary }) {
    const color = BOARD_COLORS[list.color ?? "blue"];
    const s = list.todoStats;
    return (
        <Link
            href={`/productivity/todos?list=${list.id}`}
            className="flex items-center gap-3 rounded-xl bg-gray-100 p-4 hover:bg-gray-200 transition-colors"
        >
            <span className={`rounded-lg p-2 text-white ${color.band}`}>
                <ListTodo className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{list.title || "To-do list"}</span>
                <span className="block text-xs text-gray-500">
                    {s ? `${s.open} to do` : ""}
                    {s && s.today > 0 && <span className="text-amber-600"> · {s.today} today</span>}
                    {s && s.overdue > 0 && <span className="text-red-600"> · {s.overdue} overdue</span>}
                </span>
            </span>
        </Link>
    );
}
