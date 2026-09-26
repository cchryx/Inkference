"use client";

import { useCallback, useEffect, useRef, useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    closestCorners,
    getFirstCollision,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlarmClock, CalendarDays, ChevronLeft, Columns3, Eye, EyeOff, Kanban, MoreHorizontal, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/general/ConfirmModal";
import { deleteDriveFile, renameDriveFile, savePlanner } from "@/actions/drive/drive";
import { setPreferences } from "@/actions/preferences";
import {
    BOARD_COLORS,
    LIMITS,
    boardStats,
    newCard,
    newId,
    todayKey,
    withBoardReminders,
    type Board,
    type BoardColor,
    type Card,
    type Label,
} from "@/lib/drive";
import BoardList, { LIST_WIDTH } from "./BoardList";
import { CardFace } from "./BoardCard";
import CardModal from "./CardModal";
import LabelsModal from "./LabelsModal";
import PlannerCalendar from "./PlannerCalendar";
import PlannerWeek from "./PlannerWeek";
import OverdueModal from "./OverdueModal";

export type PlannerView = "board" | "week" | "calendar";
type Props = {
    id: string;
    initialTitle: string;
    initialBoard: Board;
    initialView?: PlannerView;
    /** Open the week view on this day ("YYYY-MM-DD"). */
    initialDay?: string;
};
type SaveState = "saved" | "saving" | "error";

const SAVE_DELAY = 700;

/** A Trello-style planner: lists of cards you can drag around. Saves as you go. */
export default function PlannerBoard({ id, initialTitle, initialBoard, initialView = "board", initialDay }: Props) {
    // Stable id so the server and browser agree (avoids a hydration warning).
    const dndId = useId();
    const router = useRouter();
    const [board, setBoard] = useState<Board>(initialBoard);
    const [title, setTitle] = useState(initialTitle);
    const [saveState, setSaveState] = useState<SaveState>("saved");
    const [view, setViewState] = useState<PlannerView>(initialView);

    const setView = (v: PlannerView) => {
        setViewState(v);
        const url = new URL(window.location.href);
        url.searchParams.delete("view");
        window.history.replaceState(null, "", url);
        // Remember it, so planners open in this view next time.
        void setPreferences({ plannerView: v });
    };

    const [active, setActive] = useState<{ id: string; type: "card" | "list" } | null>(null);
    const [openCard, setOpenCard] = useState<string | null>(null);
    const [labelsOpen, setLabelsOpen] = useState(false);
    const [overdueOpen, setOverdueOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirm, setConfirm] = useState<null | { kind: "planner" } | { kind: "list"; listId: string }>(null);
    const [addingList, setAddingList] = useState(false);
    const [listDraft, setListDraft] = useState("");

    const boardRef = useRef(board);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragSnapshot = useRef<Board | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        boardRef.current = board;
    }, [board]);

    // ---------- Saving ----------
    const saveNow = useCallback(async () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = null;
        const { error } = await savePlanner(id, withBoardReminders(boardRef.current));
        setSaveState(error ? "error" : saveTimer.current ? "saving" : "saved");
        if (error) toast.error(error);
    }, [id]);

    const scheduleSave = useCallback(() => {
        setSaveState("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => void saveNow(), SAVE_DELAY);
    }, [saveNow]);

    /** Change the board and save it shortly after. */
    const commit = useCallback(
        (update: (b: Board) => Board) => {
            setBoard((b) => update(b));
            scheduleSave();
        },
        [scheduleSave]
    );

    // Don't lose the last change when leaving the page.
    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (saveTimer.current) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => {
            window.removeEventListener("beforeunload", warn);
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
                void savePlanner(id, withBoardReminders(boardRef.current));
            }
        };
    }, [id]);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    // ---------- Board edits ----------
    const saveTitle = async () => {
        const t = title.trim() || "Untitled planner";
        setTitle(t);
        if (t === initialTitle) return;
        const { error } = await renameDriveFile(id, t);
        if (error) toast.error(error);
    };

    const updateCard = (card: Card) =>
        commit((b) => ({
            ...b,
            lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id === card.id ? card : c)) })),
        }));

    /** Tick a card. If done cards are hidden, it disappears, so offer Undo. */
    const toggleDone = (card: Card) => {
        const next = { ...card, done: !card.done };
        updateCard(next);
        if (next.done && boardRef.current.hideDone) {
            toast.success("Done! Card hidden.", {
                action: { label: "Undo", onClick: () => updateCard({ ...next, done: false }) },
            });
        }
    };

    const clearDone = (listId: string) =>
        commit((b) => ({
            ...b,
            lists: b.lists.map((l) => (l.id === listId ? { ...l, cards: l.cards.filter((c) => !c.done) } : l)),
        }));

    const moveCardToList = (cardId: string, toListId: string) =>
        commit((b) => {
            const card = b.lists.flatMap((l) => l.cards).find((c) => c.id === cardId);
            if (!card) return b;
            return {
                ...b,
                lists: b.lists.map((l) =>
                    l.id === toListId
                        ? { ...l, cards: [...l.cards.filter((c) => c.id !== cardId), card] }
                        : { ...l, cards: l.cards.filter((c) => c.id !== cardId) }
                ),
            };
        });

    const deleteCard = (cardId: string) => {
        setOpenCard(null);
        commit((b) => ({ ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })) }));
    };

    const addList = () => {
        const t = listDraft.trim();
        if (!t || board.lists.length >= LIMITS.lists) return;
        commit((b) => ({ ...b, lists: [...b.lists, { id: newId(), title: t.slice(0, 100), cards: [] }] }));
        setListDraft("");
    };

    const deleteList = (listId: string) => {
        setConfirm(null);
        commit((b) => ({ ...b, lists: b.lists.filter((l) => l.id !== listId) }));
    };

    const setLabels = (labels: Label[]) =>
        commit((b) => {
            const keep = new Set(labels.map((l) => l.id));
            return {
                ...b,
                labels,
                // Removing a label also takes it off every card.
                lists: b.lists.map((l) => ({
                    ...l,
                    cards: l.cards.map((c) => ({ ...c, labelIds: c.labelIds.filter((x) => keep.has(x)) })),
                })),
            };
        });

    const removePlanner = async () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = null;
        const { error } = await deleteDriveFile(id);
        if (error) return toast.error(error);
        toast.success("Planner deleted.");
        router.push("/productivity/planners");
    };

    // ---------- Drag and drop ----------
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        // On phones, press and hold briefly to drag (so normal swipes still scroll).
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const listOf = (b: Board, itemId: string) =>
        b.lists.find((l) => l.id === itemId) ?? b.lists.find((l) => l.cards.some((c) => c.id === itemId));

    // Lists only collide with lists; cards snap to the card (or empty list) under the pointer.
    const collision: CollisionDetection = useCallback((args) => {
        if (args.active.data.current?.type === "list") {
            return closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "list"),
            });
        }
        const pointer = pointerWithin(args);
        const hits = pointer.length ? pointer : rectIntersection(args);
        const overId = getFirstCollision(hits, "id");
        if (overId != null) {
            const over = args.droppableContainers.find((c) => c.id === overId);
            if (over?.data.current?.type === "list") {
                // Over a list: aim for the nearest card inside it, if any.
                const inside = args.droppableContainers.filter(
                    (c) => c.data.current?.type === "card" && c.data.current?.listId === overId
                );
                if (inside.length) {
                    const near = closestCenter({ ...args, droppableContainers: inside });
                    if (near.length) return near;
                }
            }
            return [{ id: overId }];
        }
        return closestCorners(args);
    }, []);

    const onDragStart = ({ active }: DragStartEvent) => {
        dragSnapshot.current = board;
        setActive({ id: String(active.id), type: active.data.current?.type === "list" ? "list" : "card" });
    };

    // Moving a card into another list happens live, while dragging.
    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over || active.data.current?.type !== "card") return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        setBoard((b) => {
            const from = listOf(b, activeId);
            const to = listOf(b, overId);
            if (!from || !to || from.id === to.id) return b;

            const card = from.cards.find((c) => c.id === activeId)!;
            let index = to.cards.length;
            if (over.data.current?.type === "card") {
                const overIndex = to.cards.findIndex((c) => c.id === overId);
                const below =
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
                index = overIndex + (below ? 1 : 0);
            }
            return {
                ...b,
                lists: b.lists.map((l) => {
                    if (l.id === from.id) return { ...l, cards: l.cards.filter((c) => c.id !== activeId) };
                    if (l.id === to.id) {
                        const cards = [...l.cards];
                        cards.splice(index, 0, card);
                        return { ...l, cards };
                    }
                    return l;
                }),
            };
        });
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActive(null);
        const snapshot = dragSnapshot.current;
        dragSnapshot.current = null;
        if (!over) {
            if (snapshot) setBoard(snapshot);
            return;
        }
        const activeId = String(active.id);
        const overId = String(over.id);

        if (active.data.current?.type === "list") {
            if (activeId !== overId) {
                commit((b) => {
                    const from = b.lists.findIndex((l) => l.id === activeId);
                    const to = b.lists.findIndex((l) => l.id === overId);
                    return from < 0 || to < 0 ? b : { ...b, lists: arrayMove(b.lists, from, to) };
                });
            }
            return;
        }

        commit((b) => {
            const list = listOf(b, activeId);
            if (!list || over.data.current?.type !== "card") return b;
            const from = list.cards.findIndex((c) => c.id === activeId);
            const to = list.cards.findIndex((c) => c.id === overId);
            if (from < 0 || to < 0 || from === to) return b;
            return {
                ...b,
                lists: b.lists.map((l) => (l.id === list.id ? { ...l, cards: arrayMove(l.cards, from, to) } : l)),
            };
        });
    };

    const onDragCancel = () => {
        setActive(null);
        if (dragSnapshot.current) setBoard(dragSnapshot.current);
        dragSnapshot.current = null;
    };

    // ---------- Render ----------
    const color = BOARD_COLORS[board.color] ?? BOARD_COLORS.slate;
    const stats = boardStats(board);
    // What the views show: finished cards can be hidden.
    const shown: Board = board.hideDone
        ? { ...board, lists: board.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => !c.done) })) }
        : board;
    const activeCard = active?.type === "card" ? board.lists.flatMap((l) => l.cards).find((c) => c.id === active.id) : null;
    const activeList = active?.type === "list" ? board.lists.find((l) => l.id === active.id) : null;
    const openCardData = openCard ? board.lists.flatMap((l) => l.cards).find((c) => c.id === openCard) : null;
    const openCardList = openCard ? listOf(board, openCard) : null;

    return (
        <div className={`flex h-full w-full flex-col ${color.soft}`}>
            {/* Header */}
            <header className="relative z-20 shrink-0 border-b border-black/5 bg-white/70 backdrop-blur px-3 md:px-5 py-2.5">
                <div className="flex items-center gap-2">
                    <Link
                        href="/productivity/planners"
                        aria-label="Back to planners"
                        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200 hover:text-black"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                    <span className={`size-3 shrink-0 rounded-full ${color.band}`} />
                    <input
                        value={title}
                        maxLength={200}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        aria-label="Planner name"
                        className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-lg font-bold outline-none hover:bg-black/5 focus:bg-white focus:ring-2 focus:ring-black"
                    />
                    <span className="hidden lg:block text-xs text-gray-500 whitespace-nowrap">
                        {stats.done}/{stats.cards} done
                    </span>
                    {stats.overdue > 0 && (
                        <button
                            type="button"
                            onClick={() => setOverdueOpen(true)}
                            className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer"
                        >
                            <AlarmClock className="size-3.5" /> {stats.overdue}
                            <span className="hidden sm:inline">overdue</span>
                        </button>
                    )}
                    {/* Board / Calendar */}
                    <div className="flex rounded-lg bg-gray-200 p-0.5 text-sm">
                        {(
                            [
                                { v: "board", label: "Board", icon: Kanban },
                                { v: "week", label: "Week", icon: Columns3 },
                                { v: "calendar", label: "Month", icon: CalendarDays },
                            ] as const
                        ).map(({ v, label, icon: Icon }) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                aria-pressed={view === v}
                                className={`flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer ${
                                    view === v ? "bg-white font-semibold shadow-sm" : "text-gray-600 hover:text-black"
                                }`}
                            >
                                <Icon className="size-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                    <span className="hidden md:block w-16 text-right text-xs text-gray-400">
                        {saveState === "saving" ? "Saving..." : saveState === "error" ? "Not saved" : "Saved"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setLabelsOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                    >
                        <Tag className="size-4" /> Labels
                    </button>
                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((o) => !o)}
                            aria-label="Planner options"
                            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer"
                        >
                            <MoreHorizontal className="size-5" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-10 z-30 w-56 rounded-lg bg-white p-2 text-sm shadow-lg ring-1 ring-black/10">
                                <p className="px-2 pb-1 text-xs font-semibold text-gray-500">Colour</p>
                                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                                    {(Object.keys(BOARD_COLORS) as BoardColor[]).map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            aria-label={c}
                                            onClick={() => commit((b) => ({ ...b, color: c }))}
                                            className={`size-6 rounded-full cursor-pointer ${BOARD_COLORS[c].band} ${
                                                board.color === c ? "ring-2 ring-black ring-offset-2" : ""
                                            }`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setOverdueOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                >
                                    <AlarmClock className="size-4" /> Overdue
                                    {stats.overdue > 0 && <span className="ml-auto text-xs font-semibold text-red-600">{stats.overdue}</span>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        commit((b) => ({ ...b, hideDone: !b.hideDone }));
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                >
                                    {board.hideDone ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                                    {board.hideDone ? "Show done cards" : "Hide done cards"}
                                    {stats.done > 0 && <span className="ml-auto text-xs text-gray-400">{stats.done}</span>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setLabelsOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Tag className="size-4" /> Edit labels
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setConfirm({ kind: "planner" });
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-600 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Trash2 className="size-4" /> Delete planner
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {view === "week" && (
                <PlannerWeek
                    board={shown}
                    startDay={initialDay}
                    onOpenCard={setOpenCard}
                    onToggleDone={toggleDone}
                    onSetDue={(cardId, due) =>
                        commit((b) => ({
                            ...b,
                            lists: b.lists.map((l) => ({
                                ...l,
                                cards: l.cards.map((c) => (c.id === cardId ? { ...c, due, time: due ? (c.time ?? null) : null } : c)),
                            })),
                        }))
                    }
                    onAddCard={(listId, t, due, atTop) =>
                        commit((b) => ({
                            ...b,
                            lists: b.lists.map((l) =>
                                l.id === listId && l.cards.length < LIMITS.cardsPerList
                                    ? {
                                          ...l,
                                          cards: atTop
                                              ? [{ ...newCard(t), due }, ...l.cards]
                                              : [...l.cards, { ...newCard(t), due }],
                                      }
                                    : l
                            ),
                        }))
                    }
                />
            )}

            {view === "calendar" && (
                <PlannerCalendar
                    board={shown}
                    onOpenCard={setOpenCard}
                    onSetDue={(cardId, due) =>
                        commit((b) => ({
                            ...b,
                            lists: b.lists.map((l) => ({
                                ...l,
                                cards: l.cards.map((c) => (c.id === cardId ? { ...c, due, time: due ? (c.time ?? null) : null } : c)),
                            })),
                        }))
                    }
                    onAddCard={(listId, t, due) =>
                        commit((b) => ({
                            ...b,
                            lists: b.lists.map((l) =>
                                l.id === listId && l.cards.length < LIMITS.cardsPerList
                                    ? { ...l, cards: [...l.cards, { ...newCard(t), due }] }
                                    : l
                            ),
                        }))
                    }
                />
            )}

            {/* Lists */}
            {view === "board" && (
            <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={collision}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
            >
                <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden snap-x px-3 md:px-5 py-4 pb-24 md:pb-4">
                    <SortableContext items={board.lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                        {shown.lists.map((list) => (
                            <BoardList
                                key={list.id}
                                list={list}
                                labels={board.labels}
                                onRename={(t) =>
                                    commit((b) => ({
                                        ...b,
                                        lists: b.lists.map((l) => (l.id === list.id ? { ...l, title: t } : l)),
                                    }))
                                }
                                onDelete={() =>
                                    list.cards.length ? setConfirm({ kind: "list", listId: list.id }) : deleteList(list.id)
                                }
                                onAddCard={(t) =>
                                    commit((b) => ({
                                        ...b,
                                        lists: b.lists.map((l) =>
                                            l.id === list.id ? { ...l, cards: [...l.cards, newCard(t)] } : l
                                        ),
                                    }))
                                }
                                onOpenCard={(c) => setOpenCard(c.id)}
                                onToggleDone={toggleDone}
                                doneCount={board.lists.find((l) => l.id === list.id)?.cards.filter((c) => c.done).length ?? 0}
                                onClearDone={() => clearDone(list.id)}
                            />
                        ))}
                    </SortableContext>

                    {/* Add list */}
                    {board.lists.length < LIMITS.lists && (
                        <div className={`${LIST_WIDTH} shrink-0 snap-start`}>
                            {addingList ? (
                                <div className="space-y-2 rounded-xl bg-gray-100 p-2">
                                    <input
                                        autoFocus
                                        value={listDraft}
                                        maxLength={100}
                                        onChange={(e) => setListDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") addList();
                                            if (e.key === "Escape") setAddingList(false);
                                        }}
                                        placeholder="List name, e.g. This week"
                                        className="w-full rounded-md bg-white px-2.5 py-2 text-sm outline-none ring-2 ring-black"
                                    />
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={addList}
                                            className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer"
                                        >
                                            Add list
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAddingList(false);
                                                setListDraft("");
                                            }}
                                            aria-label="Cancel"
                                            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200 cursor-pointer"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAddingList(true)}
                                    className="flex w-full items-center gap-1.5 rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white cursor-pointer"
                                >
                                    <Plus className="size-4" /> Add another list
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeCard ? (
                        <div className="w-64">
                            <CardFace card={activeCard} labels={board.labels} overlay />
                        </div>
                    ) : activeList ? (
                        <div className={`${LIST_WIDTH} rotate-2 rounded-xl bg-gray-100 p-3 shadow-lg ring-1 ring-black/10`}>
                            <p className="text-sm font-semibold">{activeList.title}</p>
                            <p className="text-xs text-gray-500">
                                {activeList.cards.length} card{activeList.cards.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
            )}

            {openCardData && openCardList && (
                <CardModal
                    card={openCardData}
                    listId={openCardList.id}
                    lists={board.lists.map((l) => ({ id: l.id, title: l.title }))}
                    labels={board.labels}
                    onChange={updateCard}
                    onMove={(to) => moveCardToList(openCardData.id, to)}
                    onDelete={() => deleteCard(openCardData.id)}
                    onEditLabels={() => setLabelsOpen(true)}
                    onClose={() => setOpenCard(null)}
                />
            )}

            {overdueOpen && (
                <OverdueModal
                    board={board}
                    onClose={() => setOverdueOpen(false)}
                    onOpenCard={(cardId) => {
                        setOverdueOpen(false);
                        setOpenCard(cardId);
                    }}
                    onUpdate={updateCard}
                    onMoveAllToToday={(ids) => {
                        const today = todayKey();
                        const set = new Set(ids);
                        commit((b) => ({
                            ...b,
                            lists: b.lists.map((l) => ({
                                ...l,
                                cards: l.cards.map((c) => (set.has(c.id) ? { ...c, due: today, time: null } : c)),
                            })),
                        }));
                        toast.success(`Moved ${ids.length} card${ids.length === 1 ? "" : "s"} to today.`);
                    }}
                />
            )}

            {labelsOpen && <LabelsModal labels={board.labels} onChange={setLabels} onClose={() => setLabelsOpen(false)} />}

            <ConfirmModal
                isPending={false}
                open={!!confirm}
                title={confirm?.kind === "planner" ? "Delete this planner?" : "Delete this list?"}
                text={
                    confirm?.kind === "planner"
                        ? "All its lists and cards will be deleted. This can't be undone."
                        : "Its cards will be deleted too."
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={() => (confirm?.kind === "planner" ? removePlanner() : confirm && deleteList(confirm.listId))}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}
