"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

// Every preference we store, with what values are allowed.
const PrefsSchema = z
    .object({
        plannerView: z.enum(["board", "week", "calendar"]),
        /** When photo storage was last recounted (ms). */
        storageSyncedAt: z.number(),
        /** Your timezone, for reminders and the weekly summary. */
        timeZone: z.string().max(60),
        /** When the last weekly summary was sent (ms). */
        weeklySentAt: z.number(),
    })
    .partial();

export type Preferences = z.infer<typeof PrefsSchema>;

async function me() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

export async function getPreferences(): Promise<Preferences> {
    const userId = await me();
    if (!userId) return {};
    const row = await prisma.userPreference.findUnique({ where: { userId }, select: { data: true } });
    const parsed = PrefsSchema.safeParse(row?.data ?? {});
    return parsed.success ? parsed.data : {};
}

/** Saves one or more preferences (merged into what's already saved). */
export async function setPreferences(patch: Preferences) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    const parsed = PrefsSchema.safeParse(patch);
    if (!parsed.success) return { error: "Invalid preference." };

    const current = await getPreferences();
    const data = { ...current, ...parsed.data } as Prisma.InputJsonValue;
    await prisma.userPreference.upsert({
        where: { userId },
        update: { data },
        create: { userId, data },
    });
    return { error: null };
}

/** Remembers your timezone (so reminders say "today" on the right day). */
export async function saveTimeZone(timeZone: string) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
    } catch {
        return { error: "Unknown timezone." };
    }
    return setPreferences({ timeZone: String(timeZone).slice(0, 60) });
}
