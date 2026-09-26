// Shared Drive types and helpers (safe to use on the server and in the browser).

export const DRIVE_TYPES = ["note", "planner", "todo"] as const;
export type DriveType = (typeof DRIVE_TYPES)[number];

// ---------- Notes ----------

export const MAX_NOTE_CHARS = 100_000;

/** A note is one block of text: the first line is its title. */
export function splitNote(text: string) {
    const i = text.indexOf("\n");
    return i === -1 ? { title: text, body: "" } : { title: text.slice(0, i), body: text.slice(i + 1) };
}

export function noteTitle(text: string) {
    return splitNote(text).title.trim().slice(0, 200);
}

export function notePreview(text: string) {
    return splitNote(text)
        .body.split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 140);
}

// ---------- Planners (Trello-style boards) ----------

export type Label = { id: string; name: string; color: LabelColor };
export type ChecklistItem = { id: string; text: string; done: boolean };
export type Card = {
    id: string;
    title: string;
    description: string;
    /** "YYYY-MM-DD" or null */
    due: string | null;
    /** "HH:MM" (24h) or null. Only used when there's a due date. */
    time?: string | null;
    /** When the card was made (ISO). Older cards may not have it. */
    createdAt?: string;
    labelIds: string[];
    checklist: ChecklistItem[];
    done: boolean;
    /** Remind this many minutes before it's due (0 = at due time). null = no reminder. */
    remind?: number | null;
    /** The exact moment to remind (worked out on the device, so it's in your timezone). */
    remindAt?: string | null;
};
export type List = { id: string; title: string; cards: Card[] };
export type Board = { color: BoardColor; labels: Label[]; lists: List[]; hideDone?: boolean };

export const LABEL_COLORS = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    gray: "bg-gray-500",
} as const;
export type LabelColor = keyof typeof LABEL_COLORS;

export const BOARD_COLORS = {
    slate: { band: "bg-slate-700", soft: "bg-slate-100", fade: "from-slate-100" },
    blue: { band: "bg-blue-600", soft: "bg-blue-50", fade: "from-blue-50" },
    green: { band: "bg-emerald-600", soft: "bg-emerald-50", fade: "from-emerald-50" },
    purple: { band: "bg-violet-600", soft: "bg-violet-50", fade: "from-violet-50" },
    orange: { band: "bg-orange-500", soft: "bg-orange-50", fade: "from-orange-50" },
    pink: { band: "bg-pink-500", soft: "bg-pink-50", fade: "from-pink-50" },
} as const;
export type BoardColor = keyof typeof BOARD_COLORS;

export const LIMITS = { lists: 30, cardsPerList: 300, labels: 20, checklist: 100 };

export const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14);

export function newCard(title: string): Card {
    return {
        id: newId(),
        title,
        description: "",
        due: null,
        time: null,
        createdAt: new Date().toISOString(),
        labelIds: [],
        checklist: [],
        done: false,
    };
}

/** Right now as "HH:MM" in the viewer's own timezone. */
export function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Past its date (or, for today, past its time) and not finished. */
export function isOverdue(card: { due: string | null; time?: string | null; done: boolean }, today = todayKey(), now = nowTime()) {
    if (card.done || !card.due) return false;
    return card.due < today || (card.due === today && !!card.time && card.time < now);
}

/** "14:30" -> "2:30 PM" */
export function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Order cards for one day: timed cards first (earliest first), then the
 * rest newest first, and finished cards at the bottom.
 */
export function sortDayCards<T extends Pick<Card, "done" | "time" | "createdAt">>(cards: T[]) {
    return cards
        .map((c, i) => ({ c, i }))
        .sort((a, b) => {
            if (a.c.done !== b.c.done) return a.c.done ? 1 : -1;
            const at = a.c.time ?? null;
            const bt = b.c.time ?? null;
            if (at && bt) return at.localeCompare(bt);
            if (at) return -1;
            if (bt) return 1;
            const ac = a.c.createdAt ?? "";
            const bc = b.c.createdAt ?? "";
            if (ac !== bc) return bc.localeCompare(ac);
            return b.i - a.i; // no dates: later in the list = newer
        })
        .map((x) => x.c);
}

/**
 * A new planner starts with one "To do" list. Finishing a card is the tick on
 * the card itself (and "Hide done cards" tidies them away), so there's no
 * "Done" list to keep in sync.
 */
export function defaultBoard(): Board {
    return {
        color: "slate",
        hideDone: false,
        labels: [
            { id: newId(), name: "Urgent", color: "red" },
            { id: newId(), name: "School", color: "blue" },
            { id: newId(), name: "Work", color: "green" },
            { id: newId(), name: "Personal", color: "purple" },
        ],
        lists: [{ id: newId(), title: "To do", cards: [] }],
    };
}

/** Today as "YYYY-MM-DD" in the viewer's own timezone. */
export function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function boardStats(board: Board) {
    const cards = board.lists.flatMap((l) => l.cards);
    const today = todayKey();
    return {
        lists: board.lists.length,
        cards: cards.length,
        done: cards.filter((c) => c.done).length,
        overdue: cards.filter((c) => isOverdue(c, today)).length,
    };
}

// ---------- To-do lists ----------

export type Todo = {
    id: string;
    text: string;
    done: boolean;
    /** "YYYY-MM-DD" or null */
    due: string | null;
    important: boolean;
    notes: string;
    /** When it was ticked off (ISO), for "completed" sorting. */
    doneAt: string | null;
    /** Same as on planner cards. To-dos have no time, so 9 AM is used. */
    remind?: number | null;
    remindAt?: string | null;
};
export type TodoList = { color: BoardColor; items: Todo[] };

export const TODO_LIMIT = 1000;

export function newTodo(text: string, due: string | null = null): Todo {
    return { id: newId(), text, done: false, due, important: false, notes: "", doneAt: null };
}

export function defaultTodoList(): TodoList {
    return { color: "blue", items: [] };
}

/** "YYYY-MM-DD" for a date `days` from today. */
export function dayKey(days = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todoStats(list: TodoList) {
    const today = todayKey();
    const open = list.items.filter((t) => !t.done);
    return {
        total: list.items.length,
        open: open.length,
        today: open.filter((t) => t.due === today).length,
        overdue: open.filter((t) => t.due && t.due < today).length,
    };
}

/** Anything with a due date, from a planner card or a to-do. */
export type DueItem = {
    kind: "card" | "todo";
    id: string;
    fileId: string;
    fileTitle: string;
    color: BoardColor;
    title: string;
    due: string;
    time?: string | null;
    done: boolean;
    listName?: string;
};

// ---------- Summaries for lists ----------

export type DriveFileSummary = {
    id: string;
    type: DriveType;
    title: string;
    pinned: boolean;
    updatedAt: string;
    preview: string;
    color?: BoardColor;
    stats?: ReturnType<typeof boardStats>;
    todoStats?: ReturnType<typeof todoStats>;
};

// ---------- Reminders ----------

/** Things without a time get reminded at this time of day. */
export const DEFAULT_REMIND_TIME = "09:00";

export const REMIND_OPTIONS: { value: number; label: string; noTime: string; needsTime?: boolean }[] = [
    { value: 0, label: "At due time", noTime: "Morning of (9 AM)" },
    { value: 15, label: "15 min before", noTime: "15 min before 9 AM", needsTime: true },
    { value: 60, label: "1 hour before", noTime: "1 hour before 9 AM", needsTime: true },
    { value: 1440, label: "1 day before", noTime: "Day before (9 AM)" },
    { value: 10080, label: "1 week before", noTime: "Week before (9 AM)" },
];

export const MAX_REMIND_MINUTES = 10080;

/** When to send the reminder, as an ISO time (uses this device's timezone). */
export function reminderAt(due: string | null, time: string | null | undefined, remind: number | null | undefined) {
    if (remind == null || !due) return null;
    const [y, m, d] = due.split("-").map(Number);
    const [h, mi] = (time || DEFAULT_REMIND_TIME).split(":").map(Number);
    const at = new Date(y, m - 1, d, h, mi);
    if (Number.isNaN(at.getTime())) return null;
    at.setMinutes(at.getMinutes() - remind);
    return at.toISOString();
}

/** Fills in `remindAt` on every card. Run right before saving. */
export function withBoardReminders(board: Board): Board {
    return {
        ...board,
        lists: board.lists.map((l) => ({
            ...l,
            cards: l.cards.map((c) => ({ ...c, remindAt: reminderAt(c.due, c.time, c.remind) })),
        })),
    };
}

/** Fills in `remindAt` on every to-do. Run right before saving. */
export function withTodoReminders(list: TodoList): TodoList {
    return { ...list, items: list.items.map((t) => ({ ...t, remindAt: reminderAt(t.due, null, t.remind) })) };
}
