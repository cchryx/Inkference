// Tiny endpoint for an uptime pinger (e.g. cron-job.org or UptimeRobot).
// Pinging it every ~10 minutes stops Render's free plan from putting the
// app to sleep, so pages and Discord link previews don't wait for a cold start.
// It doesn't touch the database, so it's instant and free.
export const dynamic = "force-dynamic";

export function GET() {
    return Response.json({ ok: true, time: new Date().toISOString() });
}
