import { format } from "date-fns";
import { formatTime, isOverdue, todayKey } from "@/lib/drive";

/** "YYYY-MM-DD" -> local Date (no timezone shift). */
export function parseDay(key: string) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export function dueLabel(key: string) {
    const d = parseDay(key);
    return format(d, d.getFullYear() === new Date().getFullYear() ? "MMM d" : "MMM d, yyyy");
}

/** How urgent a due date is, for colouring. */
export function dueState(key: string, done: boolean, time?: string | null): "done" | "overdue" | "soon" | "later" {
    if (done) return "done";
    const today = todayKey();
    if (isOverdue({ due: key, time, done }, today)) return "overdue";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const t = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    return key <= t ? "soon" : "later";
}

/** "Sep 25" or "Sep 25, 3:30 PM" */
export function dueWithTime(key: string, time?: string | null) {
    return time ? `${dueLabel(key)}, ${formatTime(time)}` : dueLabel(key);
}

export const DUE_STYLES = {
    done: "bg-green-600 text-white",
    overdue: "bg-red-600 text-white",
    soon: "bg-amber-400 text-black",
    later: "bg-gray-100 text-gray-700",
} as const;
