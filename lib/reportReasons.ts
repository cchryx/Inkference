// Reasons someone can pick when reporting (safe in the browser too).
export const REPORT_REASONS = [
    { id: "spam", label: "Spam or scam" },
    { id: "nudity", label: "Nudity or sexual content" },
    { id: "hate", label: "Hate or harassment" },
    { id: "violence", label: "Violence or danger" },
    { id: "stolen", label: "Stolen work or copyright" },
    { id: "other", label: "Something else" },
] as const;

export type ReportTarget = "post" | "project" | "gallery" | "photo";

export const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;
