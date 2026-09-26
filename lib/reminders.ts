import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/drive";

// Server-side reminder helpers (keeping the reminder list in sync, and
// wording the push messages).

type Item = {
    id: string;
    title: string;
    due: string | null;
    time: string | null;
    done: boolean;
    remindAt?: string | null;
};

const MAX_PER_FILE = 500;

/**
 * Makes the reminder rows for one file match what's in it: adds new ones,
 * updates moved ones (so they fire again), and removes ones that were
 * cleared, finished or deleted.
 */
export async function syncReminders(userId: string, fileId: string, items: Item[]) {
    const now = Date.now();
    const wanted = new Map<string, { title: string; due: string; time: string | null; remindAt: Date }>();
    for (const i of items) {
        if (i.done || !i.due || !i.remindAt) continue;
        const at = new Date(i.remindAt);
        if (Number.isNaN(at.getTime())) continue;
        wanted.set(i.id, { title: (i.title || "Untitled").slice(0, 200), due: i.due, time: i.time, remindAt: at });
        if (wanted.size >= MAX_PER_FILE) break;
    }

    const existing = await prisma.driveReminder.findMany({
        where: { fileId },
        select: { id: true, itemId: true, title: true, due: true, time: true, remindAt: true, sentAt: true },
    });
    const byItem = new Map(existing.map((e) => [e.itemId, e]));

    const stale = existing.filter((e) => !wanted.has(e.itemId)).map((e) => e.id);
    if (stale.length) await prisma.driveReminder.deleteMany({ where: { id: { in: stale } } });

    for (const [itemId, w] of wanted) {
        const e = byItem.get(itemId);
        if (!e) {
            // Setting a reminder for a time that already passed: nothing to send.
            if (w.remindAt.getTime() < now - 60_000) continue;
            await prisma.driveReminder.create({ data: { userId, fileId, itemId, ...w } });
            continue;
        }
        const moved = e.remindAt.getTime() !== w.remindAt.getTime();
        if (!moved && e.title === w.title && e.due === w.due && e.time === w.time) continue;
        await prisma.driveReminder.update({
            where: { id: e.id },
            data: { ...w, sentAt: moved ? null : e.sentAt },
        });
    }
}

// ---------- Dates in someone's own timezone ----------

export const DEFAULT_TIME_ZONE = "America/Toronto";

export function safeTimeZone(tz: unknown) {
    if (typeof tz !== "string" || !tz) return DEFAULT_TIME_ZONE;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return tz;
    } catch {
        return DEFAULT_TIME_ZONE;
    }
}

/** Today as "YYYY-MM-DD" in that timezone. */
export function todayIn(tz: string, now = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** "YYYY-MM-DD" plus some days. */
export function addDays(key: string, days: number) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Tue" / "Sep 30" for a day key (no timezone math needed). */
export function shortDay(key: string, today: string) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const diff = Math.round((date.getTime() - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff > 1 && diff < 7) return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "due today at 2:30 PM", "due Friday", "was due yesterday"... */
export function dueWords(due: string, time: string | null, today: string) {
    const when = shortDay(due, today);
    const at = time ? ` at ${formatTime(time)}` : "";
    if (due < today) return `was due ${when}${at}`;
    return `due ${when}${at}`;
}
