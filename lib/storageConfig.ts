// Storage limits (safe to use in the browser too).
// Inkference runs on Cloudinary's free plan, so each person gets a fair share.
// The starting limit. Admins can change it in Settings > Admin.
export const DEFAULT_STORAGE_LIMIT_MB = Number(process.env.NEXT_PUBLIC_STORAGE_LIMIT_MB) || 100;
export const MB = 1024 * 1024;

/** Biggest resume PDF allowed. */
export const RESUME_MAX_MB = 5;

/** Whose profile to send people to when they want to support the app. */
export const SUPPORT_USERNAME = "cchryx";

export const STORAGE_FULL_MESSAGE = `You've used all your photo storage. Inkference runs on a free plan, so storage is limited. Delete some old photos to make room, or support the app by buying @${SUPPORT_USERNAME} a coffee.`;

export function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
