import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { isCronRequest, unauthorized } from "@/lib/cron";
import { dueWords, safeTimeZone, todayIn } from "@/lib/reminders";

// Sends the planner / to-do reminders that are due. Call it every 5 minutes.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LATE_LIMIT_MS = 12 * 60 * 60 * 1000; // older than this = skip it, too late to be useful

async function run(req: Request) {
    if (!isCronRequest(req)) return unauthorized();

    const now = new Date();
    const due = await prisma.driveReminder.findMany({
        where: { sentAt: null, remindAt: { lte: now, gte: new Date(now.getTime() - LATE_LIMIT_MS) } },
        orderBy: { remindAt: "asc" },
        take: 300,
        include: { file: { select: { title: true, type: true } } },
    });
    if (!due.length) return Response.json({ sent: 0 });

    // Claim them first, so two runs at once never send twice.
    const { count } = await prisma.driveReminder.updateMany({
        where: { id: { in: due.map((r) => r.id) }, sentAt: null },
        data: { sentAt: now },
    });
    if (!count) return Response.json({ sent: 0 });

    // Everyone's own timezone, for "due today" / "due tomorrow".
    const prefs = await prisma.userPreference.findMany({
        where: { userId: { in: [...new Set(due.map((r) => r.userId))] } },
        select: { userId: true, data: true },
    });
    const zoneOf = new Map(prefs.map((p) => [p.userId, safeTimeZone((p.data as { timeZone?: unknown })?.timeZone)]));

    let sent = 0;
    for (const r of due) {
        const tz = zoneOf.get(r.userId) ?? safeTimeZone(null);
        const where = r.file.title || (r.file.type === "planner" ? "Planner" : "To-dos");
        const report = await sendPushToUsers(
            [r.userId],
            {
                title: `Reminder: ${r.title}`.slice(0, 120),
                body: `${where} · ${dueWords(r.due, r.time, todayIn(tz, now))}`,
                url: r.file.type === "planner" ? `/productivity/planners/${r.fileId}` : `/productivity/todos?list=${r.fileId}`,
                tag: `reminder:${r.id}`,
            },
            "reminder"
        );
        sent += report.sent;
    }
    return Response.json({ reminders: due.length, sent });
}

export const GET = run;
export const POST = run;
