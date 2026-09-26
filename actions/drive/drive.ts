"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { syncReminders } from "@/lib/reminders";
import {
    BOARD_COLORS,
    LABEL_COLORS,
    LIMITS,
    MAX_NOTE_CHARS,
    MAX_REMIND_MINUTES,
    TODO_LIMIT,
    TRACKER_LIMIT,
    boardStats,
    defaultTracker,
    trackerStats,
    type Tracker,
    defaultBoard,
    dayKey,
    defaultTodoList,
    todoStats,
    noteTitle,
    notePreview,
    type Board,
    type BoardColor,
    type DriveFileSummary,
    type DriveType,
    type DueItem,
    type TodoList,
} from "@/lib/drive";
import { getSession } from "@/lib/session";

// Everything in Drive is private: every action works only on your own files.

async function me() {
    const session = await getSession();
    return session?.user?.id ?? null;
}

const DriveTypeSchema = z.enum(["note", "planner", "todo", "tracker"]);

const id = z.string().min(1).max(40);
const remind = z.number().int().min(0).max(MAX_REMIND_MINUTES).nullable().optional();
const remindAt = z.string().max(40).nullable().optional();
const BoardSchema = z.object({
    hideDone: z.boolean().optional(),
    color: z.enum(Object.keys(BOARD_COLORS) as [BoardColor, ...BoardColor[]]),
    labels: z
        .array(
            z.object({
                id,
                name: z.string().max(40),
                color: z.enum(Object.keys(LABEL_COLORS) as [keyof typeof LABEL_COLORS, ...(keyof typeof LABEL_COLORS)[]]),
            })
        )
        .max(LIMITS.labels),
    lists: z
        .array(
            z.object({
                id,
                title: z.string().max(100),
                cards: z
                    .array(
                        z.object({
                            id,
                            title: z.string().max(500),
                            description: z.string().max(10_000),
                            due: z
                                .string()
                                .regex(/^\d{4}-\d{2}-\d{2}$/)
                                .nullable(),
                            time: z
                                .string()
                                .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                                .nullable()
                                .optional(),
                            createdAt: z.string().max(40).optional(),
                            labelIds: z.array(id).max(LIMITS.labels),
                            checklist: z
                                .array(z.object({ id, text: z.string().max(300), done: z.boolean() }))
                                .max(LIMITS.checklist),
                            done: z.boolean(),
                            remind,
                            remindAt,
                        })
                    )
                    .max(LIMITS.cardsPerList),
            })
        )
        .max(LIMITS.lists),
});

const day = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable();

const TodoListSchema = z.object({
    color: z.enum(Object.keys(BOARD_COLORS) as [BoardColor, ...BoardColor[]]),
    items: z
        .array(
            z.object({
                id,
                text: z.string().max(500),
                done: z.boolean(),
                due: day,
                important: z.boolean(),
                notes: z.string().max(5000),
                doneAt: z.string().max(40).nullable(),
                remind,
                remindAt,
            })
        )
        .max(TODO_LIMIT),
});

const TrackerSchema = z.object({
    color: z.enum(Object.keys(BOARD_COLORS) as [BoardColor, ...BoardColor[]]),
    items: z
        .array(
            z.object({
                id,
                name: z.string().max(200),
                episode: z.number().int().min(0).max(1_000_000),
                total: z.number().int().min(1).max(1_000_000).nullable(),
                status: z.enum(["watching", "planned", "completed"]),
                link: z.string().max(500),
                notes: z.string().max(2000),
                updatedAt: z.string().max(40),
            })
        )
        .max(TRACKER_LIMIT),
});

const readTracker = (content: unknown) => {
    const parsed = TrackerSchema.safeParse(content);
    return (parsed.success ? parsed.data : defaultTracker()) as Tracker;
};

const readBoard = (content: unknown) => {
    const parsed = BoardSchema.safeParse(content);
    return (parsed.success ? parsed.data : defaultBoard()) as Board;
};
const readTodos = (content: unknown) => {
    const parsed = TodoListSchema.safeParse(content);
    return (parsed.success ? parsed.data : defaultTodoList()) as TodoList;
};

const asText = (content: unknown) =>
    typeof (content as { text?: unknown })?.text === "string" ? (content as { text: string }).text : "";

function summarize(f: {
    id: string;
    type: string;
    title: string;
    pinned: boolean;
    updatedAt: Date;
    content: unknown;
}): DriveFileSummary {
    const base = {
        id: f.id,
        type: f.type as DriveType,
        title: f.title,
        pinned: f.pinned,
        updatedAt: f.updatedAt.toISOString(),
    };
    if (f.type === "planner") {
        const board = readBoard(f.content);
        return { ...base, preview: "", color: board.color, stats: boardStats(board) };
    }
    if (f.type === "todo") {
        const list = readTodos(f.content);
        return { ...base, preview: "", color: list.color, todoStats: todoStats(list) };
    }
    if (f.type === "tracker") {
        const t = readTracker(f.content);
        const latest = [...t.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        return {
            ...base,
            preview: latest ? `${latest.name} · ep ${latest.episode}` : "",
            color: t.color,
            trackerStats: trackerStats(t),
        };
    }
    return { ...base, preview: notePreview(asText(f.content)) };
}

/** Your files, newest first (optionally only one kind). */
export async function listDriveFiles(type?: DriveType, take = 200): Promise<DriveFileSummary[]> {
    const userId = await me();
    if (!userId) return [];
    const files = await prisma.driveFile.findMany({
        where: { userId, ...(type ? { type } : {}) },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: Math.min(take, 500),
        select: { id: true, type: true, title: true, pinned: true, updatedAt: true, content: true },
    });
    return files.map(summarize);
}

export type NoteData = { id: string; text: string; pinned: boolean; createdAt: string; updatedAt: string };

/** All your notes with their text (so switching between them is instant). */
export async function getNotes(): Promise<NoteData[]> {
    const userId = await me();
    if (!userId) return [];
    const notes = await prisma.driveFile.findMany({
        where: { userId, type: "note" },
        orderBy: { updatedAt: "desc" },
        take: 500,
        select: { id: true, content: true, pinned: true, createdAt: true, updatedAt: true },
    });
    return notes.map((n) => ({
        id: n.id,
        text: asText(n.content),
        pinned: n.pinned,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
    }));
}

export async function getPlanner(fileId: string) {
    const userId = await me();
    if (!userId) return null;
    const file = await prisma.driveFile.findFirst({
        where: { id: fileId, userId, type: "planner" },
        select: { id: true, title: true, content: true, updatedAt: true },
    });
    if (!file) return null;
    return {
        id: file.id,
        title: file.title,
        board: readBoard(file.content),
        updatedAt: file.updatedAt.toISOString(),
    };
}

export type TodoListData = { id: string; title: string; list: TodoList; updatedAt: string };

/** All your to-do lists with their tasks. */
export async function getTodoLists(): Promise<TodoListData[]> {
    const userId = await me();
    if (!userId) return [];
    const files = await prisma.driveFile.findMany({
        where: { userId, type: "todo" },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, title: true, content: true, updatedAt: true },
    });
    return files.map((f) => ({
        id: f.id,
        title: f.title,
        list: readTodos(f.content),
        updatedAt: f.updatedAt.toISOString(),
    }));
}

export async function saveTodoList(fileId: string, list: TodoList) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const parsed = TodoListSchema.safeParse(list);
    if (!parsed.success) return { error: "Couldn't save this list (something is too long)." };

    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId, type: "todo" },
        data: { content: parsed.data as Prisma.InputJsonValue },
    });
    if (!count) return { error: "List not found." };

    await syncReminders(
        userId,
        fileId,
        parsed.data.items.map((t) => ({ id: t.id, title: t.text, due: t.due, time: null, done: t.done, remindAt: t.remindAt }))
    ).catch((err) => console.error("syncReminders failed:", err));
    return { error: null };
}

/**
 * Everything with a due date up to `untilDays` from today (plus anything
 * overdue), from planners and to-do lists. Used for "Coming up".
 */
export async function getDueItems(untilDays = 14): Promise<DueItem[]> {
    const userId = await me();
    if (!userId) return [];
    const files = await prisma.driveFile.findMany({
        where: { userId, type: { in: ["planner", "todo"] } },
        take: 300,
        select: { id: true, type: true, title: true, content: true },
    });

    const limit = dayKey(untilDays);
    const items: DueItem[] = [];

    for (const f of files) {
        if (f.type === "planner") {
            const board = readBoard(f.content);
            for (const l of board.lists)
                for (const c of l.cards)
                    if (c.due && !c.done && c.due <= limit)
                        items.push({
                            kind: "card",
                            id: c.id,
                            fileId: f.id,
                            fileTitle: f.title || "Untitled planner",
                            color: board.color,
                            title: c.title,
                            due: c.due,
                            time: c.time ?? null,
                            done: c.done,
                            listName: l.title,
                        });
        } else {
            const list = readTodos(f.content);
            for (const t of list.items)
                if (t.due && !t.done && t.due <= limit)
                    items.push({
                        kind: "todo",
                        id: t.id,
                        fileId: f.id,
                        fileTitle: f.title || "To-do list",
                        color: list.color,
                        title: t.text,
                        due: t.due,
                        done: t.done,
                    });
        }
    }
    // By day, then timed ones first (earliest first).
    return items
        .sort(
            (a, b) =>
                a.due.localeCompare(b.due) ||
                (a.time && b.time ? a.time.localeCompare(b.time) : a.time ? -1 : b.time ? 1 : 0)
        )
        .slice(0, 200);
}

export async function createDriveFile(type: DriveType, title?: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first.", id: null };
    if (!DriveTypeSchema.safeParse(type).success) return { error: "Unknown file type.", id: null };

    const count = await prisma.driveFile.count({ where: { userId } });
    if (count >= 2000) return { error: "Your Drive is full (2,000 files).", id: null };

    const file = await prisma.driveFile.create({
        data: {
            userId,
            type,
            title: (
                title?.trim() ||
                (type === "planner"
                    ? "Untitled planner"
                    : type === "todo"
                      ? "New list"
                      : type === "tracker"
                        ? "Watchlist"
                        : "")
            ).slice(0, 200),
            content: (type === "planner"
                ? defaultBoard()
                : type === "todo"
                  ? defaultTodoList()
                  : type === "tracker"
                    ? defaultTracker()
                    : { text: "" }) as Prisma.InputJsonValue,
        },
        select: { id: true },
    });
    return { error: null, id: file.id };
}

export async function saveNote(fileId: string, text: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    if (typeof text !== "string") return { error: "Invalid note." };
    const clean = text.slice(0, MAX_NOTE_CHARS);

    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId, type: "note" },
        data: { content: { text: clean }, title: noteTitle(clean) },
    });
    return count ? { error: null } : { error: "Note not found." };
}

export async function savePlanner(fileId: string, board: Board) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const parsed = BoardSchema.safeParse(board);
    if (!parsed.success) return { error: "Couldn't save this planner (something is too long)." };

    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId, type: "planner" },
        data: { content: parsed.data as Prisma.InputJsonValue },
    });
    if (!count) return { error: "Planner not found." };

    await syncReminders(
        userId,
        fileId,
        parsed.data.lists.flatMap((l) =>
            l.cards.map((c) => ({ id: c.id, title: c.title, due: c.due, time: c.time ?? null, done: c.done, remindAt: c.remindAt }))
        )
    ).catch((err) => console.error("syncReminders failed:", err));
    return { error: null };
}

export async function renameDriveFile(fileId: string, title: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId },
        data: { title: String(title ?? "").trim().slice(0, 200) },
    });
    return count ? { error: null } : { error: "File not found." };
}

export async function setDriveFilePinned(fileId: string, pinned: boolean) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId },
        data: { pinned: !!pinned },
    });
    return count ? { error: null } : { error: "File not found." };
}

export async function deleteDriveFile(fileId: string) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const { count } = await prisma.driveFile.deleteMany({ where: { id: fileId, userId } });
    return count ? { error: null } : { error: "File not found." };
}

export type TrackerData = { id: string; title: string; tracker: Tracker; updatedAt: string };

/** All your trackers with their shows. */
export async function getTrackers(): Promise<TrackerData[]> {
    const userId = await me();
    if (!userId) return [];
    const files = await prisma.driveFile.findMany({
        where: { userId, type: "tracker" },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, title: true, content: true, updatedAt: true },
    });
    return files.map((f) => ({
        id: f.id,
        title: f.title,
        tracker: readTracker(f.content),
        updatedAt: f.updatedAt.toISOString(),
    }));
}

export async function saveTracker(fileId: string, tracker: Tracker) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const parsed = TrackerSchema.safeParse(tracker);
    if (!parsed.success) return { error: "Couldn't save this tracker (something is too long)." };
    const { count } = await prisma.driveFile.updateMany({
        where: { id: fileId, userId, type: "tracker" },
        data: { content: parsed.data as Prisma.InputJsonValue },
    });
    return count ? { error: null } : { error: "Tracker not found." };
}
