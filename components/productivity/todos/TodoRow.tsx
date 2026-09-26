"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Bell, CalendarDays, ChevronDown, Star, Trash2 } from "lucide-react";
import { BOARD_COLORS, dayKey, formatTime, isOverdue, todayKey, type BoardColor, type Todo } from "@/lib/drive";
import { parseDay } from "@/components/productivity/planner/dates";
import ReminderPicker from "../ReminderPicker";

export function dueText(due: string) {
    if (due === todayKey()) return "Today";
    if (due === dayKey(1)) return "Tomorrow";
    if (due === dayKey(-1)) return "Yesterday";
    const d = parseDay(due);
    return format(d, d.getFullYear() === new Date().getFullYear() ? "EEE, MMM d" : "MMM d, yyyy");
}

type Props = {
    todo: Todo;
    listName?: string;
    listColor?: BoardColor;
    onChange: (todo: Todo) => void;
    onDelete: () => void;
};

/** One task: tick it, edit it, star it, give it a date or notes. */
export default function TodoRow({ todo, listName, listColor, onChange, onDelete }: Props) {
    const [open, setOpen] = useState(false);
    const set = (patch: Partial<Todo>) => onChange({ ...todo, ...patch });
    const overdue = isOverdue(todo);

    return (
        <li className="group rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 px-3 py-2.5">
                <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => set({ done: !todo.done, doneAt: todo.done ? null : new Date().toISOString() })}
                    aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                    className="size-4.5 shrink-0 rounded-full accent-black cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                    <input
                        value={todo.text}
                        maxLength={500}
                        onChange={(e) => set({ text: e.target.value })}
                        onBlur={() => !todo.text.trim() && set({ text: "Untitled task" })}
                        className={`w-full bg-transparent text-sm outline-none ${todo.done ? "text-gray-400 line-through" : ""}`}
                    />
                    {(todo.due || listName || todo.notes) && (
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                            {listName && (
                                <span className="flex items-center gap-1">
                                    <span className={`size-2 rounded-full ${BOARD_COLORS[listColor ?? "blue"].band}`} />
                                    {listName}
                                </span>
                            )}
                            {todo.due && (
                                <span className={`flex items-center gap-1 ${overdue ? "font-medium text-red-600" : todo.due === todayKey() && !todo.done ? "text-amber-600" : ""}`}>
                                    <CalendarDays className="size-3" /> {dueText(todo.due)}
                                    {todo.time && <span className="tabular-nums">{formatTime(todo.time)}</span>}
                                    {todo.remind != null && !todo.done && <Bell className="size-3" aria-label="Reminder set" />}
                                </span>
                            )}
                            {todo.notes && <span className="truncate max-w-40">{todo.notes.split("\n")[0]}</span>}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => set({ important: !todo.important })}
                    aria-label={todo.important ? "Remove star" : "Mark as important"}
                    className={`shrink-0 rounded p-1 cursor-pointer ${todo.important ? "text-amber-500" : "text-gray-300 hover:text-gray-500"}`}
                >
                    <Star className={`size-4.5 ${todo.important ? "fill-amber-400" : ""}`} />
                </button>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-label="More details"
                    aria-expanded={open}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer"
                >
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {open && (
                <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Due</span>
                        {[
                            { label: "Today", value: todayKey() },
                            { label: "Tomorrow", value: dayKey(1) },
                            { label: "Next week", value: dayKey(7) },
                        ].map((o) => (
                            <button
                                key={o.label}
                                type="button"
                                onClick={() => set({ due: o.value })}
                                className={`rounded-md px-2 py-1 text-xs ring-1 cursor-pointer ${
                                    todo.due === o.value ? "bg-black text-white ring-black" : "ring-gray-300 hover:bg-gray-100"
                                }`}
                            >
                                {o.label}
                            </button>
                        ))}
                        <input
                            type="date"
                            value={todo.due ?? ""}
                            onChange={(e) => set({ due: e.target.value || null, ...(e.target.value ? {} : { time: null }) })}
                            className="rounded-md px-2 py-0.5 text-xs ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-black"
                        />
                        <input
                            type="time"
                            aria-label="Time (optional)"
                            title={todo.due ? "Time (optional)" : "Pick a date first"}
                            disabled={!todo.due}
                            value={todo.time ?? ""}
                            onChange={(e) => set({ time: e.target.value || null })}
                            className="rounded-md px-2 py-0.5 text-xs ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-black disabled:opacity-40"
                        />
                        {todo.due && (
                            <button
                                type="button"
                                onClick={() => set({ due: null, time: null })}
                                className="text-xs text-gray-500 hover:text-black hover:underline cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Remind</span>
                        <div className="min-w-44">
                            <ReminderPicker compact due={todo.due} time={todo.time} value={todo.remind} onChange={(remind) => set({ remind })} />
                        </div>
                    </div>
                    <textarea
                        value={todo.notes}
                        maxLength={5000}
                        onChange={(e) => set({ notes: e.target.value })}
                        placeholder="Add notes"
                        className="w-full min-h-16 resize-none rounded-md bg-gray-50 p-2 text-sm outline-none ring-1 ring-black/5 field-sizing-content focus:ring-2 focus:ring-black"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                            <Trash2 className="size-3.5" /> Delete task
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}
