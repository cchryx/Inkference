"use client";

import { useEffect, useRef, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCheck, GripVertical, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { LIMITS, type Card, type Label, type List } from "@/lib/drive";
import BoardCard from "./BoardCard";

type Props = {
    list: List;
    labels: Label[];
    onRename: (title: string) => void;
    onDelete: () => void;
    onAddCard: (title: string) => void;
    onOpenCard: (card: Card) => void;
    onToggleDone: (card: Card) => void;
    doneCount?: number;
    onClearDone?: () => void;
};

export const LIST_WIDTH = "w-[85vw] max-w-[300px] sm:w-72";

/** One column of the board. Drag it by its header; cards drag on their own. */
export default function BoardList({ list, labels, onRename, onDelete, onAddCard, onOpenCard, onToggleDone, doneCount = 0, onClearDone }: Props) {
    const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: list.id,
        data: { type: "list" },
    });

    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [menuOpen, setMenuOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const full = list.cards.length >= LIMITS.cardsPerList;

    // Close the menu when clicking elsewhere.
    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    const saveTitle = () => {
        setEditing(false);
        const t = title.trim();
        if (t && t !== list.title) onRename(t);
        else setTitle(list.title);
    };

    const addCard = () => {
        const t = draft.trim();
        if (!t || full) return;
        onAddCard(t);
        setDraft("");
        // Keep the new card in view.
        requestAnimationFrame(() => cardsRef.current?.scrollTo({ top: cardsRef.current.scrollHeight }));
    };

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={`${LIST_WIDTH} shrink-0 snap-start flex max-h-full flex-col rounded-xl bg-gray-100 ${
                isDragging ? "opacity-40" : ""
            }`}
        >
            {/* Header */}
            <div className="flex items-center gap-1 px-2 pt-2 pb-1">
                <button
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    aria-label={`Move list ${list.title}`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-grab touch-none"
                >
                    <GripVertical className="size-4" />
                </button>
                {editing ? (
                    <input
                        autoFocus
                        value={title}
                        maxLength={100}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitle();
                            if (e.key === "Escape") {
                                setTitle(list.title);
                                setEditing(false);
                            }
                        }}
                        className="min-w-0 flex-1 rounded-md bg-white px-2 py-1 text-sm font-semibold outline-none ring-2 ring-black"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-sm font-semibold hover:bg-gray-200 cursor-text"
                    >
                        {list.title}
                    </button>
                )}
                <span className="px-1 text-xs text-gray-500">{list.cards.length}</span>
                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="List options"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black cursor-pointer"
                    >
                        <MoreHorizontal className="size-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-md bg-white text-sm shadow-lg ring-1 ring-black/10">
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setAdding(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                <Plus className="size-4" /> Add card
                            </button>
                            {doneCount > 0 && onClearDone && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onClearDone();
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    <CheckCheck className="size-4" /> Clear done cards ({doneCount})
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete();
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                            >
                                <Trash2 className="size-4" /> Delete list
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div ref={cardsRef} className="scroll-thin flex min-h-2 flex-1 flex-col gap-2 overflow-y-auto px-2 py-1">
                <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {list.cards.map((card) => (
                        <BoardCard
                            key={card.id}
                            listId={list.id}
                            card={card}
                            labels={labels}
                            onOpen={() => onOpenCard(card)}
                            onToggleDone={() => onToggleDone(card)}
                        />
                    ))}
                </SortableContext>

                {adding && (
                    <div className="space-y-2">
                        <textarea
                            autoFocus
                            value={draft}
                            maxLength={500}
                            rows={2}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    addCard();
                                }
                                if (e.key === "Escape") setAdding(false);
                            }}
                            placeholder="What needs doing?"
                            className="block w-full resize-none rounded-lg bg-white p-2.5 text-sm shadow-sm outline-none ring-1 ring-black/15 focus:ring-2 focus:ring-black/50"
                        />
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={addCard}
                                disabled={full}
                                className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer disabled:opacity-50"
                            >
                                Add card
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAdding(false);
                                    setDraft("");
                                }}
                                aria-label="Cancel"
                                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!adding && (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    disabled={full}
                    className="m-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer disabled:opacity-50"
                >
                    <Plus className="size-4" /> {full ? "List is full" : "Add a card"}
                </button>
            )}
        </div>
    );
}
