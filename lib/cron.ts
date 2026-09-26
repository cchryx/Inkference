import { timingSafeEqual } from "crypto";

/**
 * Scheduled jobs (reminders, weekly summary) are started by a pinger
 * (Google Apps Script). It proves it's allowed with CRON_SECRET, sent as
 * "Authorization: Bearer <secret>" or "?key=<secret>".
 */
export function isCronRequest(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const query = new URL(req.url).searchParams.get("key");
    const given = header || query || "";
    const a = Buffer.from(given);
    const b = Buffer.from(secret);
    return a.length === b.length && timingSafeEqual(a, b);
}

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
