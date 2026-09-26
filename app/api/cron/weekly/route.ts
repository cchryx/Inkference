import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { sendPushToUsers } from "@/lib/push";
import { isCronRequest, unauthorized } from "@/lib/cron";
import { addDays, safeTimeZone, shortDay, todayIn } from "@/lib/reminders";

// Weekly summary push: "6 things due this week...". Call it once a week
// (e.g. Sunday evening). Safe to call more often: each person gets at most
// one every 5 days.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_GAP_MS = 5 * 24 * 60 * 60 * 1000;

type Loose = { title?: unknown; text?: unknown; due?: unknown; time?: unknown; done?: unknown };

function itemsOf(type: string, content: unknown) {
    const c = content as { lists?: { cards?: Loose[] }[]; items?: Loose[] } | null;
    const raw: Loose[] = type === "planner" ? (c?.lists ?? []).flatMap((l) => l.cards ?? []) : (c?.items ?? []);
    return raw
        .filter((i) => typeof i.due === "string" && !i.done)
        .map((i) => ({
            title: String(i.title ?? i.text ?? "Untitled"),
            due: i.due as string,
            time: typeof i.time === "string" ? i.time : null,
        }));
}

async function run(req: Request) {
    if (!isCronRequest(req)) return unauthorized();
    const now = new Date();

    // Only people who can get a push.
    const subs = await prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] });
    const userIds = subs.map((s) => s.userId);
    let sent = 0;

    for (const userId of userIds) {
        const pref = await prisma.userPreference.findUnique({ where: { userId }, select: { data: true } });
        const data = (pref?.data ?? {}) as Record<string, unknown>;
        if (typeof data.weeklySentAt === "number" && now.getTime() - data.weeklySentAt < MIN_GAP_MS) continue;

        const tz = safeTimeZone(data.timeZone);
        const today = todayIn(tz, now);
        const end = addDays(today, 6);

        const files = await prisma.driveFile.findMany({
            where: { userId, type: { in: ["planner", "todo"] } },
            select: { title: true, type: true, content: true },
            take: 300,
        });

        let overdue = 0;
        const perFile: { name: string; count: number }[] = [];
        const week: { title: string; due: string; time: string | null }[] = [];
        for (const f of files) {
            const items = itemsOf(f.type, f.content);
            overdue += items.filter((i) => i.due < today).length;
            const inWeek = items.filter((i) => i.due >= today && i.due <= end);
            if (inWeek.length) {
                perFile.push({ name: f.title || (f.type === "planner" ? "Planner" : "To-dos"), count: inWeek.length });
                week.push(...inWeek);
            }
        }
        if (!week.length && !overdue) continue; // nothing to say

        week.sort((a, b) => a.due.localeCompare(b.due) || (a.time ?? "99").localeCompare(b.time ?? "99"));
        perFile.sort((a, b) => b.count - a.count);

        const parts: string[] = [];
        if (week.length) {
            const top = perFile.slice(0, 3).map((p) => `${p.name}: ${p.count}`);
            if (perFile.length > 3) top.push(`+${perFile.length - 3} more`);
            parts.push(top.join(", ") + ".");
            parts.push(`First up: ${week[0].title.slice(0, 60)} (${shortDay(week[0].due, today)}).`);
        }
        if (overdue) parts.push(`${overdue} overdue.`);

        const report = await sendPushToUsers(
            [userId],
            {
                title: week.length
                    ? `Your week: ${week.length} thing${week.length === 1 ? "" : "s"} due`
                    : `You have ${overdue} overdue thing${overdue === 1 ? "" : "s"}`,
                body: parts.join(" "),
                url: "/productivity",
                tag: "weekly",
            },
            "weekly"
        );
        if (report.sent) sent++;

        const next = { ...data, weeklySentAt: now.getTime() } as Prisma.InputJsonValue;
        await prisma.userPreference.upsert({
            where: { userId },
            update: { data: next },
            create: { userId, data: next },
        });
    }

    return Response.json({ people: userIds.length, sent });
}

export const GET = run;
export const POST = run;
