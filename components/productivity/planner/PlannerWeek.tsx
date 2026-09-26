"use client";

import { useLayoutEffect, useMemo, useRef, useState, useId } from "react";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    pointerWithin,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarX2, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Dropdown from "@/components/general/Dropdown";
import { BOARD_COLORS, LIMITS, sortDayCards, todayKey, type Board, type Card } from "@/lib/drive";
import { CardFace } from "./BoardCard";
import { parseDay } from "./dates";
import { useScrollFade } from "@/hooks/useScrollFade";

type Props = {
    board: Board;
    onOpenCard: (cardId: string) => void;
    onSetDue: (cardId: string, due: string | null) => void;
    onToggleDone: (card: Card) => void;
    /** `atTop`: phones show the newest card first. */
    onAddCard: (listId: string, title: string, due: string | null, atTop?: boolean) => void;
    /** "YYYY-MM-DD" to open on (first column after "No date"). Default: today. */
    startDay?: string;
};

const NO_DATE = "no-date";
const toKey = (d: Date) => format(d, "yyyy-MM-dd");
const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

/**
 * Week view: one column per day (plus "No date"), each holding the cards
 * due that day. Drag a card to another day to reschedule it.
 */
// How many days are made at a time when you scroll near an edge.
const PAST = 8; // days before today made at first
const CHUNK = 7; // days added when you scroll past the end
const MAX_RANGE = 730; // up to about two years either way

/**
 * Day columns: "No date" stays pinned on the left, then today, then every
 * day after it. Scroll right for later days, left for earlier ones; more
 * days are added as you get close to either end. Drag a card to another
 * day to reschedule it.
 */
export default function PlannerWeek({ board, onOpenCard, onSetDue, onToggleDone, onAddCard, startDay }: Props) {
    // Stable id so the server and browser agree (avoids a hydration warning).
    const dndId = useId();
    const today = todayKey();
    const todayDate = useMemo(() => startOfDay(new Date()), []);
    // Where to open (days from today), e.g. a day picked in "Coming up".
    const [start] = useState(() => {
        if (!startDay) return 0;
        const n = differenceInCalendarDays(parseDay(startDay), todayDate);
        return Number.isFinite(n) ? Math.max(-MAX_RANGE + PAST, Math.min(MAX_RANGE - 21, n)) : 0;
    });
    // Days shown, as offsets from today (negative = past).
    const [range, setRange] = useState({ from: Math.min(-PAST, start - PAST), to: Math.max(21, start + 21) });
    const [showUndated, setShowUndated] = useState(true);
    const [listId, setListId] = useState(board.lists[0]?.id ?? "");
    const [dragging, setDragging] = useState<Card | null>(null);
    const [firstVisible, setFirstVisible] = useState(0);
    const [edges, setEdges] = useState({ left: false, right: true });

    const scroller = useRef<HTMLDivElement>(null);
    const step = useRef(0); // width of one column + gap, in px
    const rangeRef = useRef(range);
    const prepended = useRef(0); // days just added on the left
    const growing = useRef(false); // waiting for new days to render
    const ready = useRef(false); // only grow after the first scroll to today
    const pendingJump = useRef<number | null>(null);

    const days = useMemo(
        () => Array.from({ length: range.to - range.from + 1 }, (_, i) => addDays(todayDate, range.from + i)),
        [range, todayDate]
    );

    const byDay = useMemo(() => {
        const map = new Map<string, Card[]>();
        for (const l of board.lists)
            for (const c of l.cards) {
                const key = c.due ?? NO_DATE;
                map.set(key, [...(map.get(key) ?? []), c]);
            }
        // Timed cards first (by time), then newest first; done at the bottom.
        for (const [key, cards] of map) map.set(key, sortDayCards(cards));
        return map;
    }, [board]);

    const measure = () => {
        const el = scroller.current;
        const cols = el?.querySelectorAll<HTMLElement>("[data-day]");
        if (cols && cols.length > 1) step.current = cols[1].offsetLeft - cols[0].offsetLeft;
        return step.current;
    };

    const scrollToOffset = (offset: number, smooth = false) => {
        const el = scroller.current;
        const w = measure();
        if (!el || !w) return;
        el.scrollTo({ left: (offset - rangeRef.current.from) * w, behavior: smooth ? "smooth" : "auto" });
    };

    // Start with today (or the chosen day) right next to "No date".
    // The page can still be laying out on the first frame, so keep trying
    // for a few frames until today really is the first column.
    useLayoutEffect(() => {
        let tries = 0;
        let frame = 0;
        const place = () => {
            const el = scroller.current;
            const w = measure();
            const want = (start - rangeRef.current.from) * w;
            if (el && w) el.scrollLeft = want;
            if (el && w && Math.abs(el.scrollLeft - want) < 2) {
                ready.current = true;
                return;
            }
            if (++tries < 30) frame = requestAnimationFrame(place);
            else ready.current = true;
        };
        place();
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // After new days render: keep the same days in view (days added on the
    // left push everything right), or finish a jump to a far-away week.
    useLayoutEffect(() => {
        rangeRef.current = range;
        growing.current = false;
        const el = scroller.current;
        if (!el) return;
        if (pendingJump.current !== null) {
            const t = pendingJump.current;
            pendingJump.current = null;
            prepended.current = 0;
            scrollToOffset(t, true);
        } else if (prepended.current) {
            el.scrollLeft += prepended.current * measure();
            prepended.current = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const onScroll = () => {
        const el = scroller.current;
        const w = step.current || measure();
        if (!el || !w) return;
        const buffer = w * 2;
        setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
        setFirstVisible(range.from + Math.round(el.scrollLeft / w));

        if (growing.current || !ready.current) return;
        // Older days only appear once you've scrolled all the way back.
        if (el.scrollLeft < 2 && range.from > -MAX_RANGE) {
            growing.current = true;
            prepended.current = CHUNK;
            setRange((r) => ({ ...r, from: r.from - CHUNK }));
        } else if (el.scrollLeft + el.clientWidth > el.scrollWidth - buffer && range.to < MAX_RANGE) {
            growing.current = true;
            setRange((r) => ({ ...r, to: r.to + CHUNK }));
        }
    };

    const jump = (by: number) => {
        const target = firstVisible + by;
        if (target - 3 < range.from || target + 10 > range.to) {
            // Make that part of the strip first, then scroll there.
            pendingJump.current = target;
            setRange((r) => ({ from: Math.min(r.from, target - CHUNK), to: Math.max(r.to, target + CHUNK) }));
        } else scrollToOffset(target, true);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
    );

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setDragging(null);
        if (!over) return;
        const card = active.data.current?.card as Card | undefined;
        const target = String(over.id);
        const due = target === NO_DATE ? null : target;
        if (card && card.due !== due) onSetDue(card.id, due);
    };

    const target = board.lists.find((l) => l.id === listId) ?? board.lists[0];
    const canAdd = !!target && target.cards.length < LIMITS.cardsPerList;
    const headerDate = addDays(todayDate, firstVisible);
    const fade = (BOARD_COLORS[board.color] ?? BOARD_COLORS.slate).fade;

    const column = (d: Date) => {
        const key = toKey(d);
        return (
            <DayColumn
                key={key}
                id={key}
                title={format(d, "EEEE")}
                subtitle={format(d, "MMM d")}
                isToday={key === today}
                isPast={key < today}
                cards={byDay.get(key) ?? []}
                board={board}
                canAdd={canAdd}
                onAdd={(t) => target && onAddCard(target.id, t, key, isPhone())}
                onOpenCard={onOpenCard}
                onToggleDone={onToggleDone}
            />
        );
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 md:px-5 pt-3">
                <h2 className="mr-auto text-base font-bold">{format(headerDate, "MMMM yyyy")}</h2>
                <button
                    type="button"
                    onClick={() => scrollToOffset(0, true)}
                    className="rounded-md bg-white px-2 py-0.5 text-xs sm:text-sm ring-1 ring-black/10 hover:bg-gray-50 cursor-pointer"
                >
                    Today
                </button>
                <button
                    type="button"
                    onClick={() => jump(-7)}
                    aria-label="Back a week"
                    className="rounded-md p-1 hover:bg-white cursor-pointer"
                >
                    <ChevronLeft className="size-4 sm:size-5" />
                </button>
                <button
                    type="button"
                    onClick={() => jump(7)}
                    aria-label="Forward a week"
                    className="rounded-md p-1 hover:bg-white cursor-pointer"
                >
                    <ChevronRight className="size-4 sm:size-5" />
                </button>
                {/* Phones: the rest goes on a second row */}
                <span aria-hidden className="basis-full sm:hidden" />

                <button
                    type="button"
                    onClick={() => setShowUndated((s) => !s)}
                    aria-pressed={showUndated}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm ring-1 cursor-pointer ${
                        showUndated ? "bg-white ring-black/20" : "ring-black/10 text-gray-600 hover:bg-white"
                    }`}
                >
                    <CalendarX2 className="size-3.5 sm:size-4" /> No date
                </button>
                {board.lists.length > 0 && (
                    <label className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500">
                        Add to
                        <Dropdown
                            size="sm"
                            value={target?.id ?? ""}
                            options={board.lists.map((l) => ({ value: l.id, label: l.title || "Untitled list" }))}
                            onChange={setListId}
                            aria-label="List new cards go to"
                            className="max-w-32"
                        />
                    </label>
                )}
            </div>

            <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={({ active }) => setDragging((active.data.current?.card as Card) ?? null)}
                onDragEnd={onDragEnd}
                onDragCancel={() => setDragging(null)}
            >
                <div className="flex min-h-0 flex-1 flex-col md:flex-row md:items-stretch gap-3 px-3 md:px-5 pt-3 pb-3 md:pb-1">
                    {/* Pinned: cards without a date (bottom half on phones) */}
                    {showUndated && (
                        <DayColumn
                            id={NO_DATE}
                            title="No date"
                            subtitle="Unscheduled"
                            muted
                            narrow
                            cards={byDay.get(NO_DATE) ?? []}
                            board={board}
                            canAdd={canAdd}
                            onAdd={(t) => target && onAddCard(target.id, t, null, isPhone())}
                            onOpenCard={onOpenCard}
                            onToggleDone={onToggleDone}
                        />
                    )}

                    {/* Days, scrolling sideways, with fades at the edges */}
                    <div className="relative min-h-0 min-w-0 flex-1 order-1 md:order-none">
                        <div
                            ref={scroller}
                            onScroll={onScroll}
                            className="scroll-thin flex h-full items-stretch gap-3 overflow-x-auto overflow-y-hidden scroll-auto pl-3 pr-3 pb-3"
                        >
                            {days.map(column)}
                        </div>
                        <div
                            aria-hidden
                            className={`pointer-events-none absolute top-0 bottom-3 left-0 w-3 bg-gradient-to-r ${fade} to-transparent transition-opacity ${
                                edges.left ? "opacity-100" : "opacity-0"
                            }`}
                        />
                        <div
                            aria-hidden
                            className={`pointer-events-none absolute top-0 bottom-3 right-0 w-16 bg-gradient-to-l ${fade} to-transparent transition-opacity ${
                                edges.right ? "opacity-100" : "opacity-0"
                            }`}
                        />
                    </div>
                </div>

                <DragOverlay>
                    {dragging ? (
                        <div className="w-60">
                            <CardFace card={dragging} labels={board.labels} overlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function DayColumn({
    id,
    title,
    subtitle,
    isToday,
    isPast,
    muted,
    narrow,
    cards,
    board,
    canAdd,
    onAdd,
    onOpenCard,
    onToggleDone,
}: {
    id: string;
    title: string;
    subtitle: string;
    isToday?: boolean;
    isPast?: boolean;
    muted?: boolean;
    narrow?: boolean;
    cards: Card[];
    board: Board;
    canAdd: boolean;
    onAdd: (title: string) => void;
    onOpenCard: (cardId: string) => void;
    onToggleDone: (card: Card) => void;
}) {
    const { ref: fadeRef, style: fadeStyle, onScroll: onFadeScroll } = useScrollFade<HTMLDivElement>();
    const { setNodeRef, isOver } = useDroppable({ id });
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState("");
    const open = cards.filter((c) => !c.done).length;

    const add = () => {
        const t = draft.trim();
        if (!t) return;
        onAdd(t);
        setDraft("");
    };

    return (
        <div
            ref={setNodeRef}
            {...(muted ? {} : { "data-day": id })}
            className={`flex min-h-0 shrink-0 snap-start flex-col rounded-xl transition-colors ${
                narrow ? "order-2 h-[45%] w-full md:order-none md:h-auto md:w-56 md:mb-3" : "w-[82vw] max-w-[340px] sm:w-60"
            } ${
                isOver ? "bg-sky-50 ring-2 ring-inset ring-sky-400" : muted ? "bg-gray-200/70" : isToday ? "bg-white shadow-sm ring-1 ring-inset ring-black/10" : "bg-gray-200/70"
            }`}
        >
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-baseline justify-between gap-2">
                    <p className={`flex items-center gap-2 font-semibold ${isPast && !isToday ? "text-gray-500" : ""}`}>
                        {title}
                        {isToday && (
                            <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase leading-4 tracking-wide text-white">
                                Today
                            </span>
                        )}
                    </p>
                    {cards.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {open}/{cards.length}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {/* Cards (phones: under the add box, newest first) */}
                <div
                    ref={fadeRef}
                    onScroll={onFadeScroll}
                    style={fadeStyle}
                    className="scroll-thin order-2 md:order-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pt-0.5 pb-2"
                >
                    {cards.map((card) => (
                        <DraggableCard
                            key={card.id}
                            card={card}
                            board={board}
                            onOpen={() => onOpenCard(card.id)}
                            onToggleDone={() => onToggleDone(card)}
                        />
                    ))}
                    {!cards.length && !adding && (
                        <p className="px-1 py-2 text-xs text-gray-400">{muted ? "Everything has a date" : "Nothing planned"}</p>
                    )}
                </div>

                {/* Add (phones: at the top; bigger screens: at the bottom) */}
                <div className="order-1 md:order-2 shrink-0 px-2 pb-2">
                    {adding ? (
                        <div className="space-y-2 pt-0.5">
                            <textarea
                                autoFocus
                                value={draft}
                                maxLength={500}
                                rows={2}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        add();
                                    }
                                    if (e.key === "Escape") setAdding(false);
                                }}
                                placeholder="What's happening?"
                                className="block w-full resize-none rounded-lg bg-white p-2.5 text-sm shadow-sm outline-none ring-1 ring-black/15 focus:ring-2 focus:ring-black/50"
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={add}
                                    className="rounded-md bg-black px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 cursor-pointer"
                                >
                                    Add
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
                    ) : (
                        canAdd && (
                            <button
                                type="button"
                                onClick={() => setAdding(true)}
                                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer"
                            >
                                <Plus className="size-4" /> Add
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function DraggableCard({
    card,
    board,
    onOpen,
    onToggleDone,
}: {
    card: Card;
    board: Board;
    onOpen: () => void;
    onToggleDone: () => void;
}) {
    const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: card.id, data: { card } });
    const listName = board.lists.find((l) => l.cards.some((c) => c.id === card.id))?.title;
    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className="touch-manipulation">
            <CardFace card={card} labels={board.labels} onOpen={onOpen} onToggleDone={onToggleDone} dragging={isDragging} />
            {listName && <p className="mt-0.5 truncate pl-1 text-[10px] text-gray-400">{listName}</p>}
        </div>
    );
}
