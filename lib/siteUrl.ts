/** The public address of the site, e.g. https://inkference.app (no trailing slash). */
export const SITE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://inkference.app").replace(/\/+$/, "");
