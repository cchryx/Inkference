/** "now", "5m", "3h", "2d", "4w", or a date like "Mar 4". */
export function timeShort(date: string | Date) {
    const d = typeof date === "string" ? new Date(date) : date;
    const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    if (s < 2419200) return `${Math.floor(s / 604800)}w`;
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}
