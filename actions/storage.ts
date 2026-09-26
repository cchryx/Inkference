"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsageBytes, syncFromCloudinary } from "@/lib/storage";
import { deleteUnusedUploads } from "@/lib/cleanupUploads";
import { STORAGE_LIMIT_BYTES } from "@/lib/storageConfig";
import { getPreferences, setPreferences } from "@/actions/preferences";

const RECOUNT_EVERY_MS = 10 * 60 * 1000; // 10 minutes

async function me() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

export type StorageUsage = {
    used: number;
    limit: number;
    files: number;
    byKind: { kind: string; bytes: number; files: number }[];
    syncedAt: number | null;
};

async function usage(userId: string, syncedAt: number | null): Promise<StorageUsage> {
    const groups = await prisma.storedFile.groupBy({
        by: ["kind"],
        where: { userId },
        _sum: { bytes: true },
        _count: { _all: true },
    });
    const byKind = groups
        .map((g) => ({ kind: g.kind, bytes: g._sum.bytes ?? 0, files: g._count._all }))
        .sort((a, b) => b.bytes - a.bytes);
    return {
        used: byKind.reduce((s, g) => s + g.bytes, 0),
        limit: STORAGE_LIMIT_BYTES,
        files: byKind.reduce((s, g) => s + g.files, 0),
        byKind,
        syncedAt,
    };
}

/** How much photo storage you're using. Counts from scratch the first time. */
export async function getMyStorage(): Promise<StorageUsage | { error: string }> {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };

    let { storageSyncedAt = null } = await getPreferences();
    if (!storageSyncedAt) {
        try {
            await syncFromCloudinary(userId);
            storageSyncedAt = Date.now();
            await setPreferences({ storageSyncedAt });
        } catch (err) {
            console.error("storage sync failed:", err);
        }
    }
    return usage(userId, storageSyncedAt);
}

/** Recount from Cloudinary (at most every 10 minutes). */
export async function recountMyStorage(): Promise<StorageUsage | { error: string }> {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };

    const { storageSyncedAt } = await getPreferences();
    if (storageSyncedAt && Date.now() - storageSyncedAt < RECOUNT_EVERY_MS) {
        return usage(userId, storageSyncedAt);
    }
    try {
        await syncFromCloudinary(userId);
    } catch (err) {
        console.error("storage recount failed:", err);
        return { error: "Couldn't recount right now. Try again later." };
    }
    const now = Date.now();
    await setPreferences({ storageSyncedAt: now });
    return usage(userId, now);
}

/**
 * Deletes your uploads that aren't used anywhere (leftovers from things you
 * deleted or never finished). Anything still shown on your profile stays.
 */
export async function cleanUpMyStorage(): Promise<{ error: string | null; deleted: number }> {
    const userId = await me();
    if (!userId) return { error: "Sign in first.", deleted: 0 };

    const files = await prisma.storedFile.findMany({
        // Skip very new files: they may belong to an upload still finishing.
        where: { userId, createdAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } },
        select: { url: true },
        orderBy: { createdAt: "asc" },
        take: 300,
    });
    let deleted = 0;
    for (let i = 0; i < files.length; i += 100) {
        deleted += await deleteUnusedUploads(files.slice(i, i + 100).map((f) => f.url), userId);
    }
    return { error: null, deleted };
}

/** Is there room for `incoming` more bytes? (Checked before a background upload starts.) */
export async function checkStorageRoom(incoming = 0): Promise<{ ok: boolean }> {
    const userId = await me();
    if (!userId) return { ok: false };
    const used = await getUsageBytes(userId);
    const bytes = Math.max(0, Number(incoming) || 0);
    return { ok: used < STORAGE_LIMIT_BYTES && used + bytes <= STORAGE_LIMIT_BYTES };
}
