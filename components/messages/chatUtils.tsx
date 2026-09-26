import { Fragment } from "react";
import { UserIcon } from "@/components/general/UserIcon";

type Mini = { id: string; image: string | null };

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "now", "5m", "3h", "Mon", "Sep 3" (for the chat list). */
export function shortAgo(iso: string, now: number) {
    const t = new Date(iso).getTime();
    const diff = Math.max(0, now - t);
    if (diff < MIN) return "now";
    if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
    if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
    if (diff < 7 * DAY) return new Date(t).toLocaleDateString("en-US", { weekday: "short" });
    return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** Label between messages: "Today 3:42 PM", "Mon 3:42 PM", "Sep 3, 3:42 PM". */
export function stampLabel(iso: string, now: number) {
    const d = new Date(iso);
    const today = new Date(now);
    const yesterday = new Date(now - DAY);
    if (sameDay(d, today)) return `Today ${clock(iso)}`;
    if (sameDay(d, yesterday)) return `Yesterday ${clock(iso)}`;
    if (now - d.getTime() < 7 * DAY) return `${d.toLocaleDateString("en-US", { weekday: "long" })} ${clock(iso)}`;
    const sameYear = d.getFullYear() === today.getFullYear();
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) })}, ${clock(iso)}`;
}

/** Show a time label if it's the first message, a new day, or 30+ minutes since the last one. */
export function needsStamp(prevIso: string | undefined, iso: string) {
    if (!prevIso) return true;
    const a = new Date(prevIso);
    const b = new Date(iso);
    return !sameDay(a, b) || b.getTime() - a.getTime() > 30 * MIN;
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

/** Text with clickable links. */
export function Linkified({ text, mine }: { text: string; mine: boolean }) {
    const parts = text.split(URL_RE);
    return (
        <>
            {parts.map((p, i) =>
                i % 2 === 1 ? (
                    <a
                        key={i}
                        href={p}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`underline underline-offset-2 break-all ${mine ? "text-white" : "text-blue-700"}`}
                    >
                        {p}
                    </a>
                ) : (
                    <Fragment key={i}>{p}</Fragment>
                )
            )}
        </>
    );
}

/** One face for a 1-on-1, two stacked faces for a group. */
export function ChatAvatar({ people, isGroup, size = "md" }: { people: Mini[]; isGroup: boolean; size?: "sm" | "md" }) {
    const big = size === "md" ? "size-12" : "size-9";
    const small = size === "md" ? "size-8" : "size-6";
    if (!isGroup || people.length < 2) {
        return (
            <span className={`${big} shrink-0`}>
                <UserIcon image={people[0]?.image} size={big} />
            </span>
        );
    }
    return (
        <span className={`relative ${big} shrink-0`}>
            <span className="absolute left-0 top-0">
                <UserIcon image={people[0].image} size={small} />
            </span>
            <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-white">
                <UserIcon image={people[1].image} size={small} />
            </span>
        </span>
    );
}
