"use client";

import { differenceInCalendarDays } from "date-fns";
import { AlarmClock, CalendarCheck, CheckCircle2 } from "lucide-react";
import { LABEL_COLORS, isOverdue, todayKey, type Board, type Card } from "@/lib/drive";
import BoardDialog from "./BoardDialog";
import { dueWithTime, parseDay } from "./dates";

type Props = {
    board: Board;
    onOpenCard: (cardId: string) => void;
    onUpdate: (card: Card) => void;
    onMoveAllToToday: (cardIds: string[]) => void;
    onClose: () => void;
};

function lateText(due: string) {
    const days = differenceInCalendarDays(new Date(), parseDay(due));
    if (days <= 0) return "Earlier today";
    return days === 1 ? "1 day late" : `${days} days late`;
}

/** Every overdue card in this planner, oldest first, with quick fixes. */
export default function OverdueModal({ board, onOpenCard, onUpdate, onMoveAllToToday, onClose }: Props) {
    const today = todayKey();
    const rows = board.lists
        .flatMap((l) => l.cards.filter((c) => isOverdue(c, today)).map((card) => ({ card, list: l.title })))
        .sort(
            (a, b) =>
                a.card.due!.localeCompare(b.card.due!) || (a.card.time ?? "99").localeCompare(b.card.time ?? "99")
        );

    const labelColor = (card: Card) => {
        const l = board.labels.find((x) => x.id === card.labelIds[0]);
        return l ? LABEL_COLORS[l.color] : "bg-gray-300";
    };

    return (
        <BoardDialog
            onClose={onClose}
            width="max-w-[520px]"
            title={
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <AlarmClock className="size-5 text-red-600" /> Overdue
                        <span className="text-sm font-normal text-gray-500">{rows.length}</span>
                    </h2>
                    <p className="text-xs text-gray-500">Unfinished cards past their date or time.</p>
                </div>
            }
        >
            {rows.length ? (
                <div className="space-y-3">
                    <ul className="scroll-thin max-h-[60vh] space-y-1.5 overflow-y-auto">
                        {rows.map(({ card, list }) => (
                            <li
                                key={card.id}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2"
                            >
                                <button
                                    type="button"
                                    onClick={() => onUpdate({ ...card, done: true })}
                                    aria-label="Mark as done"
                                    title="Mark as done"
                                    className="shrink-0 rounded-full text-gray-300 hover:text-green-600 cursor-pointer"
                                >
                                    <CheckCircle2 className="size-5" />
                                </button>
                                <span className={`w-1 self-stretch shrink-0 rounded-full ${labelColor(card)}`} />
                                <button
                                    type="button"
                                    onClick={() => onOpenCard(card.id)}
                                    className="min-w-0 flex-1 text-left cursor-pointer"
                                >
                                    <p className="truncate text-sm font-medium">{card.title}</p>
                                    <p className="truncate text-xs text-gray-500">
                                        <span className="font-medium text-red-600">{lateText(card.due!)}</span> ·{" "}
                                        {dueWithTime(card.due!, card.time)} · in {list}
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onUpdate({ ...card, due: today, time: null })}
                                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-gray-300 hover:bg-gray-100 cursor-pointer"
                                >
                                    Today
                                </button>
                            </li>
                        ))}
                    </ul>
                    {rows.length > 1 && (
                        <button
                            type="button"
                            onClick={() => onMoveAllToToday(rows.map((r) => r.card.id))}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-black py-2 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer"
                        >
                            <CalendarCheck className="size-4" /> Move all {rows.length} to today
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
                    <CheckCircle2 className="size-10 text-green-500" />
                    Nothing overdue. Nice work.
                </div>
            )}
        </BoardDialog>
    );
}
