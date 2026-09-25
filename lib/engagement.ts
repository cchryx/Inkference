import { prisma } from "@/lib/prisma";

export type EngagementKind = "view" | "like" | "save" | "comment";
export type TargetType = "post" | "project";

function today() {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Logs likes/views/saves for Trending. Counted once per person, per item,
 * per day. Never throws: trending stats must not break liking or viewing.
 */
export async function recordEngagement(
    kind: EngagementKind,
    targetType: TargetType,
    targetIds: string[],
    userDataId: string
) {
    if (targetIds.length === 0) return;
    const day = today();
    try {
        await prisma.engagement.createMany({
            data: targetIds.map((targetId) => ({ kind, targetType, targetId, userDataId, day })),
            skipDuplicates: true,
        });
    } catch (err) {
        console.error("recordEngagement failed:", err);
    }
}

/** Undo a like/save (e.g. unlike) so it stops counting towards Trending. */
export async function removeEngagement(
    kind: EngagementKind,
    targetType: TargetType,
    targetId: string,
    userDataId: string
) {
    try {
        await prisma.engagement.deleteMany({
            where: { kind, targetType, targetId, userDataId },
        });
    } catch (err) {
        console.error("removeEngagement failed:", err);
    }
}
