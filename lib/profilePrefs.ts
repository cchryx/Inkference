import { prisma } from "@/lib/prisma";
import { PROFILE_SECTIONS } from "@/lib/profileSections";

/** Tabs this person hid from their profile (Settings > Profile). */
export async function getHiddenSections(userId: string): Promise<string[]> {
    const row = await prisma.userPreference.findUnique({ where: { userId }, select: { data: true } });
    const hidden = (row?.data as { hiddenSections?: unknown } | null)?.hiddenSections;
    return Array.isArray(hidden) ? hidden.filter((s): s is string => (PROFILE_SECTIONS as readonly string[]).includes(s)) : [];
}
