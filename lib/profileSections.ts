// The tabs on a profile / Build page (safe in the browser and on the server).
export const PROFILE_SECTIONS = ["projects", "experiences", "education", "merits", "skills", "photos", "posts"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export const isProfileSection = (v: unknown): v is ProfileSection =>
    typeof v === "string" && (PROFILE_SECTIONS as readonly string[]).includes(v);

/** The tabs someone chose to show (never none). */
export function shownSections(hidden: readonly string[] | null | undefined): ProfileSection[] {
    const shown = PROFILE_SECTIONS.filter((s) => !hidden?.includes(s));
    return shown.length ? shown : [...PROFILE_SECTIONS];
}

/** Which tab to open: the one asked for if it's shown, else the first shown. */
export function pickSection(wanted: unknown, shown: ProfileSection[]): ProfileSection {
    return isProfileSection(wanted) && shown.includes(wanted) ? wanted : shown[0];
}

/** Cookie that remembers the last tab you had open on your Build page. */
export const BUILD_TAB_COOKIE = "build_tab";
