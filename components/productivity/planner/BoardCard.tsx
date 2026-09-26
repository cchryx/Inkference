"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, CalendarDays, CheckCircle2, Circle, ListChecks } from "lucide-react";
import { LABEL_COLORS, type Card, type Label } from "@/lib/drive";
import { DUE_STYLES, dueState, dueWithTime } from "./dates";

type FaceProps = {
    card: Card;
    labels: Label[];
    onOpen?: () => void;
    onToggleDone?: () => void;
    dragging?: boolean;
    overlay?: boolean;
};

/** What a card looks like (used in lists and while dragging). */
export function CardFace({ card, labels, onOpen, onToggleDone, dragging, overlay }: FaceProps) {
    const cardLabels = card.labelIds
        .map((id) => labels.find((l) => l.id === id))
        .filter((l): l is Label => !!l);
    const checked = card.checklist.filter((i) => i.done).length;
    const total = card.checklist.length;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
            className={`group rounded-lg border border-gray-200 bg-white p-2.5 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)] cursor-pointer select-none transition-colors ${
                dragging ? "opacity-40" : "hover:border-gray-400"
            } ${overlay ? "rotate-2 shadow-lg border-gray-400 cursor-grabbing" : ""}`}
        >
            {cardLabels.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                    {cardLabels.map((l) => (
                        <span
                            key={l.id}
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold leading-4 text-white ${LABEL_COLORS[l.color]}`}
                        >
                            {l.name || " "}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-start gap-1.5">
                <button
                    type="button"
                    aria-label={card.done ? "Mark as not done" : "Mark as done"}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleDone?.();
                    }}
                    className={`mt-0.5 shrink-0 cursor-pointer transition-opacity ${
                        card.done ? "text-green-600" : "text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    } ${card.done ? "" : "w-0 group-hover:w-auto focus:w-auto overflow-hidden"}`}
                >
                    {card.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                </button>
                <p className={`flex-1 break-words whitespace-pre-wrap ${card.done ? "text-gray-500 line-through" : ""}`}>
                    {card.title}
                </p>
            </div>

            {(card.due || total > 0 || card.description) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                    {card.due && (
                        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${DUE_STYLES[dueState(card.due, card.done, card.time)]}`}>
                            <CalendarDays className="size-3" /> {dueWithTime(card.due, card.time)}
                        </span>
                    )}
                    {total > 0 && (
                        <span
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                                checked === total ? "bg-green-600 text-white" : ""
                            }`}
                        >
                            <ListChecks className="size-3.5" /> {checked}/{total}
                        </span>
                    )}
                    {card.description && <AlignLeft className="size-3.5" aria-label="Has a description" />}
                </div>
            )}
        </div>
    );
}

type Props = Omit<FaceProps, "dragging" | "overlay"> & { listId: string };

/** A card you can drag between lists. */
export default function BoardCard({ listId, ...face }: Props) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: face.card.id,
        data: { type: "card", listId },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...attributes}
            {...listeners}
            className="touch-manipulation"
        >
            <CardFace {...face} dragging={isDragging} />
        </div>
    );
}
