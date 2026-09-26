"use client";

import { useState } from "react";
import {
    AlignLeft,
    CalendarDays,
    CheckCircle2,
    Circle,
    ListChecks,
    MoveRight,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import { LABEL_COLORS, LIMITS, newId, type Card, type Label } from "@/lib/drive";
import BoardDialog from "./BoardDialog";
import { DUE_STYLES, dueState, dueWithTime } from "./dates";
import ReminderPicker from "../ReminderPicker";
import Dropdown from "@/components/general/Dropdown";

type Props = {
    card: Card;
    listId: string;
    lists: { id: string; title: string }[];
    labels: Label[];
    onChange: (card: Card) => void;
    onMove: (toListId: string) => void;
    onDelete: () => void;
    onEditLabels: () => void;
    onClose: () => void;
};

const SectionTitle = ({ icon: Icon, children }: { icon: typeof Tag; children: React.ReactNode }) => (
    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="size-4" /> {children}
    </h3>
);

/** Everything about one card: done, due date, labels, description, checklist. */
export default function CardModal({ card, listId, lists, labels, onChange, onMove, onDelete, onEditLabels, onClose }: Props) {
    const [newItem, setNewItem] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const set = (patch: Partial<Card>) => onChange({ ...card, ...patch });

    const done = card.checklist.filter((i) => i.done).length;
    const total = card.checklist.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const addItem = () => {
        const text = newItem.trim();
        if (!text || total >= LIMITS.checklist) return;
        set({ checklist: [...card.checklist, { id: newId(), text, done: false }] });
        setNewItem("");
    };

    return (
        <BoardDialog
            onClose={onClose}
            title={
                <div className="flex items-start gap-2">
                    <button
                        type="button"
                        onClick={() => set({ done: !card.done })}
                        aria-label={card.done ? "Mark as not done" : "Mark as done"}
                        className={`mt-1.5 shrink-0 cursor-pointer ${card.done ? "text-green-600" : "text-gray-400 hover:text-black"}`}
                    >
                        {card.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                    </button>
                    <textarea
                        value={card.title}
                        maxLength={500}
                        rows={1}
                        onChange={(e) => set({ title: e.target.value.replace(/\n/g, " ") })}
                        onBlur={() => !card.title.trim() && set({ title: "Untitled card" })}
                        className="w-full resize-none rounded-md bg-transparent px-1 py-0.5 text-lg font-bold outline-none field-sizing-content focus:bg-white focus:ring-2 focus:ring-black"
                    />
                </div>
            }
        >
            <div className="space-y-6">
                {/* Quick settings */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-3">
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <span className="flex items-center gap-2">
                            <MoveRight className="size-4" /> List
                        </span>
                        <Dropdown
                            value={listId}
                            options={lists.map((l) => ({ value: l.id, label: l.title || "Untitled list" }))}
                            onChange={onMove}
                            aria-label="List"
                            className="w-full"
                        />
                    </label>

                    <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <span className="flex items-center gap-2">
                            <CalendarDays className="size-4" /> Due
                            {card.due && (
                                <span
                                    className={`rounded px-1.5 py-0.5 normal-case tracking-normal ${DUE_STYLES[dueState(card.due, card.done, card.time)]}`}
                                >
                                    {dueWithTime(card.due, card.time)}
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                aria-label="Due date"
                                value={card.due ?? ""}
                                onChange={(e) => set({ due: e.target.value || null, ...(e.target.value ? {} : { time: null }) })}
                                className="min-w-0 flex-1 rounded-md bg-white px-2 py-1.5 text-sm font-normal text-black ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black"
                            />
                            <input
                                type="time"
                                aria-label="Time (optional)"
                                title={card.due ? "Time (optional)" : "Pick a date first"}
                                disabled={!card.due}
                                value={card.time ?? ""}
                                onChange={(e) => set({ time: e.target.value || null })}
                                className="w-28 rounded-md bg-white px-2 py-1.5 text-sm font-normal text-black ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black disabled:opacity-40"
                            />
                            {card.due && (
                                <button
                                    type="button"
                                    onClick={() => set({ due: null, time: null })}
                                    aria-label="Remove due date and time"
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-black cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <ReminderPicker
                            due={card.due}
                            time={card.time}
                            value={card.remind}
                            onChange={(remind) => set({ remind })}
                        />
                    </div>
                </div>

                {/* Labels */}
                <div>
                    <SectionTitle icon={Tag}>Labels</SectionTitle>
                    <div className="flex flex-wrap gap-1.5">
                        {labels.map((l) => {
                            const on = card.labelIds.includes(l.id);
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() =>
                                        set({
                                            labelIds: on ? card.labelIds.filter((x) => x !== l.id) : [...card.labelIds, l.id],
                                        })
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
                                        on
                                            ? `${LABEL_COLORS[l.color]} text-white shadow-sm`
                                            : `${LABEL_COLORS[l.color]} text-white opacity-40 hover:opacity-70`
                                    }`}
                                >
                                    {l.name || "Unnamed"}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={onEditLabels}
                            className="rounded-md px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-200 cursor-pointer"
                        >
                            Edit labels
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <SectionTitle icon={AlignLeft}>Description</SectionTitle>
                    <textarea
                        value={card.description}
                        maxLength={10_000}
                        onChange={(e) => set({ description: e.target.value })}
                        placeholder="Add more details..."
                        className="w-full min-h-24 resize-none rounded-md bg-white p-3 text-sm outline-none ring-1 ring-black/10 field-sizing-content focus:ring-2 focus:ring-black"
                    />
                </div>

                {/* Checklist */}
                <div>
                    <SectionTitle icon={ListChecks}>
                        Checklist {total > 0 && <span className="normal-case tracking-normal">({done}/{total})</span>}
                    </SectionTitle>
                    {total > 0 && (
                        <div className="mb-3 flex items-center gap-2">
                            <span className="w-9 text-xs text-gray-500">{pct}%</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-300">
                                <div
                                    className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-600" : "bg-black"}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <ul className="space-y-1">
                        {card.checklist.map((item) => (
                            <li key={item.id} className="group flex items-center gap-2 rounded-md px-1 hover:bg-gray-200/60">
                                <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() =>
                                        set({
                                            checklist: card.checklist.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
                                        })
                                    }
                                    className="size-4 accent-black cursor-pointer"
                                />
                                <input
                                    value={item.text}
                                    maxLength={300}
                                    onChange={(e) =>
                                        set({
                                            checklist: card.checklist.map((i) =>
                                                i.id === item.id ? { ...i, text: e.target.value } : i
                                            ),
                                        })
                                    }
                                    // Emptied out? It removes itself when you click away,
                                    // or right away with Backspace on an empty line.
                                    onBlur={(e) =>
                                        !e.target.value.trim() &&
                                        set({ checklist: card.checklist.filter((i) => i.id !== item.id) })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !item.text) {
                                            e.preventDefault();
                                            set({ checklist: card.checklist.filter((i) => i.id !== item.id) });
                                        }
                                    }}
                                    className={`min-w-0 flex-1 bg-transparent py-1 text-sm outline-none ${item.done ? "text-gray-500 line-through" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => set({ checklist: card.checklist.filter((i) => i.id !== item.id) })}
                                    aria-label="Remove item"
                                    title="Remove item"
                                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 cursor-pointer md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                        <input
                            value={newItem}
                            maxLength={300}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem()}
                            placeholder="Add an item"
                            className="min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                        />
                        <button
                            type="button"
                            onClick={addItem}
                            disabled={!newItem.trim()}
                            className="rounded-md bg-black px-3 text-sm font-semibold text-white disabled:opacity-40 cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end border-t border-gray-300 pt-4">
                    {confirmDelete ? (
                        <div className="flex items-center gap-2 text-sm">
                            Delete this card?
                            <button
                                type="button"
                                onClick={onDelete}
                                className="rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 cursor-pointer"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="rounded-md px-3 py-1.5 hover:bg-gray-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                            <Trash2 className="size-4" /> Delete card
                        </button>
                    )}
                </div>
            </div>
        </BoardDialog>
    );
}
