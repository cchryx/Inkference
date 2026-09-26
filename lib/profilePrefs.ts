import { prisma } from "@/lib/prisma";
import { isProfileSection } from "@/lib/profileSections";

/** Which tabs this person hid, and the order they put them in (Settings > Profile). */
export async function getSectionLayout(userId: string): Promise<{ hidden: string[]; order: string[] }> {
    const row = await prisma.userPreference.findUnique({ where: { userId }, select: { data: true } });
    const data = (row?.data ?? {}) as { hiddenSections?: unknown; sectionOrder?: unknown };
    const list = (v: unknown) => (Array.isArray(v) ? v.filter(isProfileSection) : []);
    return { hidden: list(data.hiddenSections), order: list(data.sectionOrder) };
}
