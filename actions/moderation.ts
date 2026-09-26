"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// The owner's side of moderation: see what was flagged, and appeal.

export type MyCase = {
    id: string;
    createdAt: string;
    targetType: string;
    label: string;
    image: string | null;
    reason: string;
    status: string;
    appeal: string | null;
    deleteAt: string | null;
};

export async function getMyCases(): Promise<MyCase[]> {
    const session = await getSession();
    if (!session) return [];
    const rows = await prisma.moderationCase.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        targetType: r.targetType,
        label: r.label,
        image: r.image,
        reason: r.reason,
        status: r.status,
        appeal: r.appeal,
        deleteAt: r.deleteAt?.toISOString() ?? null,
    }));
}

/** Ask for a flagged item to be kept. It then waits for an admin (no auto-delete). */
export async function appealCase(caseId: string, text: string) {
    const session = await getSession();
    if (!session) return { error: "Sign in first." };
    const appeal = String(text ?? "").trim().slice(0, 1000);
    if (appeal.length < 5) return { error: "Tell us a bit about why it should stay." };

    const { count } = await prisma.moderationCase.updateMany({
        where: { id: caseId, ownerId: session.user.id, status: "flagged" },
        data: { status: "appealed", appeal, appealedAt: new Date(), deleteAt: null },
    });
    return count ? { error: null } : { error: "This can't be appealed anymore." };
}
