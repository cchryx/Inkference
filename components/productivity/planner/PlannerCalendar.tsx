"use client";

import { useMemo, useState } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { CalendarX2, CheckCircle2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { LABEL_COLORS, formatTime, isOverdue, sortDayCards, todayKey, type Board, type Card } from "@/lib/drive";
import { parseDay } from "./dates";

type Props = {
    board: Board;
    onOpenCard: (cardId: string) => void;
    onSetDue: (cardId: string, due: string | null) => void;
    onAddCard: (listId: string, title: string, due: string) => void;
};

type Entry = { card: Card; listTitle: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const toKey = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Trello-style calendar: every card with a due date sits on its real day.
 * Drag a card to another day to change its date; click a day to see it
 * and add cards for that day.
 */
export default function PlannerCalendar({ board, onOpenCard, onSetDue, onAddCard }: Props) {
    const today = todayKey();
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [selected, setSelected] = useState(today);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [listId, setListId] = useState(board.lists[0]?.id ?? "");

    // Cards grouped by their due day.
    const { byDay, undated } = useMemo(() => {
        const map = new Map<string, Entry[]>();
        const none: Entry[] = [];
        for (const l of board.lists)
            for (const card of l.cards) {
                const entry = { card, listTitle: l.title };
                if (!card.due) none.push(entry);
                else map.set(card.due, [...(map.get(card.due) ?? []), entry]);
            }
        // Timed cards first (by time), then newest first; done at the bottom.
        for (const [key, entries] of map) {
            const order = sortDayCards(entries.map((e) => e.card));
            map.set(key, order.map((c) => entries.find((e) => e.card === c)!));
        }
        return { byDay: map, undated: none };
    }, [board]);

    const days = useMemo(
        () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }),
        [month]
    );

    const labelColor = (card: Card) => {
        const l = board.labels.find((x) => x.id === card.labelIds[0]);
        return l ? LABEL_COLORS[l.color] : "bg-gray-300";
    };

    const pick = (key: string) => {
        setSelected(key);
        const d = parseDay(key);
        if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
    };

    const add = () => {
        const t = draft.trim();
        const target = board.lists.find((l) => l.id === listId) ?? board.lists[0];
        if (!t || !target) return;
        onAddCard(target.id, t, selected);
        setDraft("");
    };

    // Drag and drop (mouse): cards carry their id.
    const dragProps = (cardId: string) => ({
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData("text/card-id", cardId);
            e.dataTransfer.effectAllowed = "move";
        },
    });
    const dropProps = (key: string | null) => ({
        onDragOver: (e: React.DragEvent) => {
            if (!e.dataTransfer.types.includes("text/card-id")) return;
            e.preventDefault();
            setDragOver(key ?? "none");
        },
        onDragLeave: () => setDragOver(null),
        onDrop: (e: React.DragEvent) => {
            const id = e.dataTransfer.getData("text/card-id");
            setDragOver(null);
            if (id) onSetDue(id, key);
        },
    });

    const chip = ({ card }: Entry, compact = false) => {
        const overdue = isOverdue(card, today);
        return (
            <button
                key={card.id}
                type="button"
                {...dragProps(card.id)}
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenCard(card.id);
                }}
                title={card.title}
                className={`flex w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white text-left hover:border-gray-400 transition-colors cursor-pointer ${
                    compact ? "px-1 py-0.5 text-[11px]" : "px-2 py-1.5 text-sm"
                }`}
            >
                <span className={`w-1 self-stretch shrink-0 rounded-full ${labelColor(card)}`} />
                {card.done && <CheckCircle2 className="size-3 shrink-0 text-green-600" />}
                <span
                    className={`truncate ${card.done ? "text-gray-400 line-through" : overdue ? "text-red-600" : ""}`}
                >
                    {card.time && <span className="mr-1 font-semibold tabular-nums">{formatTime(card.time)}</span>}
                    {card.title}
                </span>
            </button>
        );
    };

    const selectedEntries = byDay.get(selected) ?? [];

    return (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row gap-4 overflow-y-auto px-3 md:px-5 py-4 pb-24 md:pb-4">
            {/* Month grid */}
            <section className="flex min-w-0 flex-1 flex-col rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
                <div className="mb-3 flex items-center gap-2">
                    <h2 className="flex-1 text-lg font-bold">{format(month, "MMMM yyyy")}</h2>
                    <button
                        type="button"
                        onClick={() => {
                            setMonth(startOfMonth(new Date()));
                            setSelected(today);
                        }}
                        className="rounded-md px-2.5 py-1 text-sm ring-1 ring-black/10 hover:bg-gray-100 cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => setMonth((m) => addMonths(m, -1))}
                        aria-label="Previous month"
                        className="rounded-md p-1.5 hover:bg-gray-100 cursor-pointer"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMonth((m) => addMonths(m, 1))}
                        aria-label="Next month"
                        className="rounded-md p-1.5 hover:bg-gray-100 cursor-pointer"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
                    {WEEKDAYS.map((d) => (
                        <div key={d} className="pb-2">
                            <span className="sm:hidden">{d[0]}</span>
                            <span className="hidden sm:inline">{d}</span>
                        </div>
                    ))}
                </div>

                <div className="grid flex-1 grid-cols-7 auto-rows-fr gap-px overflow-hidden rounded-lg bg-gray-200 ring-1 ring-gray-200">
                    {days.map((d) => {
                        const key = toKey(d);
                        const entries = byDay.get(key) ?? [];
                        const inMonth = isSameMonth(d, month);
                        const isToday = key === today;
                        const isSelected = key === selected;
                        return (
                            <div
                                key={key}
                                role="button"
                                tabIndex={0}
                                onClick={() => pick(key)}
                                onKeyDown={(e) => e.key === "Enter" && pick(key)}
                                {...dropProps(key)}
                                className={`group flex min-h-14 sm:min-h-28 flex-col gap-1 p-1 sm:p-1.5 cursor-pointer transition-colors ${
                                    inMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                                } ${dragOver === key ? "!bg-sky-100" : ""} ${
                                    isSelected ? "ring-2 ring-inset ring-black" : "hover:bg-gray-50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`flex size-6 items-center justify-center rounded-full text-xs ${
                                            isToday ? "bg-black font-bold text-white" : "font-medium"
                                        }`}
                                    >
                                        {format(d, "d")}
                                    </span>
                                    {entries.length > 0 && (
                                        <span className="hidden sm:inline text-[10px] text-gray-400">{entries.length}</span>
                                    )}
                                </div>

                                {/* Phones: dots. Bigger screens: the cards. */}
                                {entries.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                                        {entries.slice(0, 3).map(({ card }) => (
                                            <span
                                                key={card.id}
                                                className={`size-1.5 rounded-full ${card.done ? "bg-green-500" : labelColor(card)}`}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="hidden sm:flex flex-col gap-1">
                                    {entries.slice(0, 3).map((e) => chip(e, true))}
                                    {entries.length > 3 && (
                                        <span className="px-1 text-[11px] font-medium text-gray-500">
                                            +{entries.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Side panel: the picked day + cards without a date */}
            <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
                <section className="rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
                    <h3 className="font-bold">{format(parseDay(selected), "EEEE, MMMM d")}</h3>
                    <p className="mb-3 text-xs text-gray-500">
                        {selected === today ? "Today · " : ""}
                        {selectedEntries.length} card{selectedEntries.length === 1 ? "" : "s"} due
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {selectedEntries.map((e) => (
                            <div key={e.card.id}>
                                {chip(e)}
                                <p className="mt-0.5 pl-3 text-[11px] text-gray-400">in {e.listTitle}</p>
                            </div>
                        ))}
                        {!selectedEntries.length && <p className="text-sm text-gray-400">Nothing due this day.</p>}
                    </div>

                    {board.lists.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                            <div className="flex gap-2">
                                <input
                                    value={draft}
                                    maxLength={500}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && add()}
                                    placeholder={`Add a card for ${format(parseDay(selected), "MMM d")}`}
                                    className="min-w-0 flex-1 rounded-md bg-white px-2.5 py-1.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                                />
                                <button
                                    type="button"
                                    onClick={add}
                                    disabled={!draft.trim()}
                                    aria-label="Add card"
                                    className="rounded-md bg-black px-2.5 text-white disabled:opacity-40 cursor-pointer"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-gray-500">
                                Add to
                                <select
                                    value={listId}
                                    onChange={(e) => setListId(e.target.value)}
                                    className="rounded-md bg-white px-2 py-1 text-xs text-black ring-1 ring-black/10 cursor-pointer"
                                >
                                    {board.lists.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </section>

                <section
                    {...dropProps(null)}
                    className={`rounded-xl p-3 shadow-sm ring-1 ring-black/5 transition-colors ${
                        dragOver === "none" ? "bg-sky-100" : "bg-white/70"
                    }`}
                >
                    <h3 className="flex items-center gap-2 font-bold">
                        <CalendarX2 className="size-4" /> No due date
                        <span className="text-xs font-normal text-gray-500">{undated.length}</span>
                    </h3>
                    <p className="mb-3 text-xs text-gray-500">
                        <span className="hidden sm:inline">Drag a card onto a day to schedule it, or drop one here to clear its date.</span>
                        <span className="sm:hidden">Open a card to give it a date.</span>
                    </p>
                    <div className="scroll-thin -mx-1 flex max-h-72 flex-col gap-1.5 overflow-y-auto px-1 pb-1">
                        {undated.map(({ card }) => (
                            <button
                                key={card.id}
                                type="button"
                                {...dragProps(card.id)}
                                onClick={() => onOpenCard(card.id)}
                                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-left text-sm hover:border-gray-400 transition-colors cursor-pointer"
                            >
                                <span className={`w-1 self-stretch shrink-0 rounded-full ${labelColor(card)}`} />
                                <span className={`truncate ${card.done ? "text-gray-400 line-through" : ""}`}>{card.title}</span>
                            </button>
                        ))}
                        {!undated.length && <p className="text-sm text-gray-400">Every card has a date.</p>}
                    </div>
                </section>
            </aside>
        </div>
    );
}
