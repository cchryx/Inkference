"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { getRawSession } from "@/lib/session";
import { FOREVER, assignableRoles, canManage, getAccount, isAdminAccount, roleOf, type Role } from "@/lib/admin";
import {
    FLAGGABLE,
    REVIEW_DAYS,
    deleteAccount,
    describeTarget,
    removeTarget,
    setHidden,
    targetLink,
    targetWords,
    tellOwner,
    type Flaggable,
    type TargetType,
} from "@/lib/moderation";
import { forgetStorageLimit, getStorageLimitMB } from "@/lib/storage";
import { reasonLabel } from "@/lib/reportReasons";

// Everything in here is for admins only.

/** The signed-in staff member ({ id, role }), or null. */
async function staff() {
    const session = await getRawSession();
    if (!session) return null;
    const account = await getAccount(session.user.id);
    return isAdminAccount(account) ? { id: session.user.id, role: roleOf(account) } : null;
}

async function adminId() {
    return (await staff())?.id ?? null;
}

const NOPE = { error: "Admins only." } as const;

/** Is the signed-in person an admin, and which role? (Used to show admin buttons.) */
export async function getAdminStatus() {
    const me = await staff();
    return { isAdmin: !!me, role: (me?.role ?? "user") as Role, canAssign: me ? assignableRoles(me.role) : [] };
}

// ---------------- Users ----------------

export type AdminUser = {
    id: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
    createdAt: string;
    role: Role;
    isAdmin: boolean;
    /** Can the person looking ban/delete/change this user? */
    manageable: boolean;
    bannedUntil: string | null;
    banReason: string | null;
    storageBytes: number;
    storageExtraMB: number;
    storageUnlimited: boolean;
};

/** Everyone, newest first (search by name, username or email). */
export async function listUsers(query = "", cursor?: string) {
    const me = await staff();
    if (!me) return { users: [] as AdminUser[], nextCursor: undefined };
    const q = query.trim();
    const where: Prisma.UserWhereInput = q
        ? {
              OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { username: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
              ],
          }
        : {};
    const rows = await prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 26,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            createdAt: true,
            role: true,
            bannedUntil: true,
            banReason: true,
            storageExtraMB: true,
            storageUnlimited: true,
        },
    });
    const page = rows.slice(0, 25);
    const sizes = await prisma.storedFile.groupBy({
        by: ["userId"],
        where: { userId: { in: page.map((u) => u.id) } },
        _sum: { bytes: true },
    });
    const sizeOf = new Map(sizes.map((s) => [s.userId, s._sum.bytes ?? 0]));
    return {
        users: page.map<AdminUser>((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            role: roleOf(u),
            isAdmin: isAdminAccount(u),
            manageable: u.id !== me.id && canManage(me.role, roleOf(u)),
            bannedUntil: u.bannedUntil && u.bannedUntil.getTime() > Date.now() ? u.bannedUntil.toISOString() : null,
            storageBytes: sizeOf.get(u.id) ?? 0,
        })),
        nextCursor: rows.length > 25 ? page[page.length - 1].id : undefined,
    };
}

/** Ban for some days (null = forever). They see the reason and are asked to sign out. */
export async function banUser(userId: string, input: { reason: string; days: number | null }) {
    const me = await staff();
    if (!me) return NOPE;
    if (userId === me.id) return { error: "You can't ban yourself." };
    const target = await getAccount(userId);
    if (!target) return { error: "User not found." };
    if (!canManage(me.role, roleOf(target))) return { error: "You can't ban someone at your level or above." };

    const reason = String(input.reason ?? "").trim().slice(0, 500);
    if (!reason) return { error: "Write a reason. They'll see it." };
    const days = input.days == null ? null : Math.min(3650, Math.max(1, Math.round(Number(input.days))));
    const until = days == null ? FOREVER : new Date(Date.now() + days * 86_400_000);

    await prisma.user.update({ where: { id: userId }, data: { bannedUntil: until, banReason: reason } });
    return { error: null };
}

export async function unbanUser(userId: string) {
    const me = await staff();
    if (!me) return NOPE;
    const target = await getAccount(userId);
    if (!target || !canManage(me.role, roleOf(target))) return { error: "You can't change this person." };
    await prisma.user.update({ where: { id: userId }, data: { bannedUntil: null, banReason: null } });
    return { error: null };
}

/** HR can make people admins; the CEO can also make HR. */
export async function setUserRole(userId: string, role: Role) {
    const me = await staff();
    if (!me) return NOPE;
    if (userId === me.id) return { error: "You can't change your own role." };
    if (!assignableRoles(me.role).includes(role)) return { error: "You can't give that role." };
    const target = await getAccount(userId);
    if (!target) return { error: "User not found." };
    if (!canManage(me.role, roleOf(target))) return { error: "You can't change someone at your level or above." };
    await prisma.user.update({ where: { id: userId }, data: { role } });
    return { error: null };
}

/** Deletes the account and everything in it. `confirm` must be their username. */
export async function deleteUserAccount(userId: string, confirm: string) {
    const me = await staff();
    if (!me) return NOPE;
    if (userId === me.id) return { error: "You can't delete your own account here." };
    const target = await getAccount(userId);
    if (!target) return { error: "User not found." };
    if (!canManage(me.role, roleOf(target))) return { error: "You can't delete someone at your level or above." };
    if ((target.username ?? "") !== String(confirm ?? "").trim()) return { error: "Type their username to confirm." };
    try {
        await deleteAccount(userId);
    } catch (err) {
        console.error("deleteUserAccount failed:", err);
        return { error: "Couldn't delete this account." };
    }
    return { error: null };
}

// ---------------- Content ----------------

/**
 * Flag (hide now, delete in 3 days unless they appeal) or delete right away.
 * `url` is for one photo inside a post.
 */
export async function moderateContent(input: {
    targetType: TargetType;
    targetId: string;
    action: "flag" | "delete";
    reason: string;
    url?: string;
}) {
    const actor = await staff();
    if (!actor) return NOPE;
    const me = actor.id;
    const reason = String(input.reason ?? "").trim().slice(0, 500);
    if (!reason) return { error: "Write a reason. The owner will see it." };

    const type = input.targetType;
    const target = await describeTarget(type, input.targetId, input.url);
    if (!target) return { error: "It's already gone." };
    if (target.ownerId !== me && !canManage(actor.role, roleOf(await getAccount(target.ownerId)))) {
        return { error: "You can't moderate someone at your level or above." };
    }

    const flag = input.action === "flag" && (FLAGGABLE as readonly string[]).includes(type);
    const words = targetWords(type);

    const c = await prisma.moderationCase.create({
        data: {
            ownerId: target.ownerId,
            adminId: me,
            targetType: type,
            targetId: input.targetId,
            label: target.label.slice(0, 200),
            image: target.image,
            reason,
            status: flag ? "flagged" : "removed",
            deleteAt: flag ? new Date(Date.now() + REVIEW_DAYS * 86_400_000) : null,
            resolvedAt: flag ? null : new Date(),
        },
    });

    if (flag) {
        await setHidden(type as Flaggable, input.targetId, true);
        await tellOwner(
            target.ownerId,
            c.id,
            `Your ${words} was flagged: "${reason}". It's hidden and will be deleted in ${REVIEW_DAYS} days unless you appeal.`
        );
    } else {
        await removeTarget(type, input.targetId, input.url);
        await tellOwner(target.ownerId, c.id, `An admin removed your ${words}: "${reason}".`);
    }

    // Anything people reported about it is now handled.
    if (type !== "post_photo") {
        await prisma.report.updateMany({
            where: { targetType: type, targetId: input.targetId, status: "open" },
            data: { status: "resolved", resolvedBy: me, resolvedAt: new Date() },
        });
    }

    revalidatePath("/", "layout");
    return { error: null };
}

export type AdminCase = {
    id: string;
    createdAt: string;
    targetType: string;
    targetId: string;
    label: string;
    image: string | null;
    reason: string;
    status: string;
    appeal: string | null;
    deleteAt: string | null;
    owner: { name: string; username: string | null; image: string | null } | null;
};

/** Open cases (appeals first), or the recent history. */
export async function listCases(view: "open" | "history" = "open"): Promise<AdminCase[]> {
    if (!(await adminId())) return [];
    const rows = await prisma.moderationCase.findMany({
        where: view === "open" ? { status: { in: ["appealed", "flagged"] } } : { status: { in: ["removed", "restored"] } },
        orderBy: view === "open" ? [{ status: "asc" }, { createdAt: "desc" }] : [{ updatedAt: "desc" }],
        take: 100,
    });
    const owners = await prisma.user.findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.ownerId))] } },
        select: { id: true, name: true, username: true, image: true },
    });
    const ownerOf = new Map(owners.map((o) => [o.id, o]));
    return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        targetType: r.targetType,
        targetId: r.targetId,
        label: r.label,
        image: r.image,
        reason: r.reason,
        status: r.status,
        appeal: r.appeal,
        deleteAt: r.deleteAt?.toISOString() ?? null,
        owner: ownerOf.get(r.ownerId) ?? null,
    }));
}

/** Decide a flagged/appealed case: put it back, or delete it now. */
export async function resolveCase(caseId: string, decision: "restore" | "delete") {
    if (!(await adminId())) return NOPE;
    const c = await prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (!c || (c.status !== "flagged" && c.status !== "appealed")) return { error: "This case is already closed." };
    const words = targetWords(c.targetType);

    if (decision === "restore") {
        if ((FLAGGABLE as readonly string[]).includes(c.targetType)) {
            await setHidden(c.targetType as Flaggable, c.targetId, false);
        }
        await prisma.moderationCase.update({ where: { id: c.id }, data: { status: "restored", resolvedAt: new Date() } });
        await tellOwner(c.ownerId, c.id, `Good news: your ${words} was reviewed and is back up.`);
    } else {
        await removeTarget(c.targetType as TargetType, c.targetId);
        await prisma.moderationCase.update({ where: { id: c.id }, data: { status: "removed", resolvedAt: new Date() } });
        await tellOwner(c.ownerId, c.id, `Your ${words} was reviewed and removed: "${c.reason}".`);
    }
    revalidatePath("/", "layout");
    return { error: null };
}

// ---------------- App settings ----------------

export async function getAppSettings() {
    if (!(await adminId())) return null;
    return { storageLimitMB: await getStorageLimitMB() };
}

/** Photo storage each person gets, in MB. */
export async function setStorageLimit(mb: number) {
    if (!(await adminId())) return NOPE;
    const value = Math.round(Number(mb));
    if (!Number.isFinite(value) || value < 10 || value > 100_000) return { error: "Pick between 10 MB and 100,000 MB." };
    await prisma.appSetting.upsert({
        where: { key: "storageLimitMB" },
        update: { value },
        create: { key: "storageLimitMB", value },
    });
    forgetStorageLimit();
    return { error: null };
}

// ---------------- Storage per person ----------------

/** Give someone extra storage on top of everyone's limit, or unlimited. */
export async function setUserStorage(userId: string, input: { extraMB: number; unlimited: boolean }) {
    const me = await staff();
    if (!me) return NOPE;
    const target = await getAccount(userId);
    if (!target) return { error: "User not found." };
    const self = userId === me.id;
    if (self ? me.role !== "ceo" : !canManage(me.role, roleOf(target))) {
        return { error: "You can't change storage for someone at your level or above." };
    }
    const extraMB = Math.round(Number(input.extraMB) || 0);
    if (extraMB < 0 || extraMB > 1_000_000) return { error: "Extra storage must be between 0 and 1,000,000 MB." };
    await prisma.user.update({
        where: { id: userId },
        data: { storageExtraMB: extraMB, storageUnlimited: !!input.unlimited },
    });
    return { error: null };
}

// ---------------- Reports from users ----------------

export type AdminReport = {
    targetType: string;
    targetId: string;
    label: string;
    image: string | null;
    link: string | null;
    count: number;
    reasons: { label: string; count: number }[];
    details: string[];
    lastAt: string;
    owner: { name: string; username: string | null } | null;
};

/** Open reports, grouped by the thing reported (most reported first). */
export async function listReports(): Promise<AdminReport[]> {
    if (!(await adminId())) return [];
    const rows = await prisma.report.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 1000,
    });

    const groups = new Map<string, typeof rows>();
    for (const r of rows) {
        const key = `${r.targetType}:${r.targetId}`;
        groups.set(key, [...(groups.get(key) ?? []), r]);
    }

    const out: AdminReport[] = [];
    const gone: string[] = [];
    for (const list of [...groups.values()].sort((a, b) => b.length - a.length).slice(0, 60)) {
        const first = list[0];
        const target = await describeTarget(first.targetType as TargetType, first.targetId);
        if (!target) {
            gone.push(...list.map((r) => r.id)); // deleted since: nothing to do
            continue;
        }
        const tally = new Map<string, number>();
        for (const r of list) tally.set(r.reason, (tally.get(r.reason) ?? 0) + 1);
        out.push({
            targetType: first.targetType,
            targetId: first.targetId,
            label: target.label,
            image: target.image,
            link: await targetLink(first.targetType, first.targetId),
            count: list.length,
            reasons: [...tally].map(([id, count]) => ({ label: reasonLabel(id), count })).sort((a, b) => b.count - a.count),
            details: list.map((r) => r.details).filter((d): d is string => !!d).slice(0, 3),
            lastAt: first.createdAt.toISOString(),
            owner: null,
        });
        const owner = await prisma.user.findUnique({ where: { id: target.ownerId }, select: { name: true, username: true } });
        out[out.length - 1].owner = owner;
    }
    if (gone.length) {
        await prisma.report.updateMany({ where: { id: { in: gone } }, data: { status: "resolved", resolvedAt: new Date() } });
    }
    return out;
}

/** Nothing wrong with it: close its reports. */
export async function dismissReports(targetType: string, targetId: string) {
    const me = await adminId();
    if (!me) return NOPE;
    await prisma.report.updateMany({
        where: { targetType, targetId, status: "open" },
        data: { status: "dismissed", resolvedBy: me, resolvedAt: new Date() },
    });
    return { error: null };
}

/** How many reports are waiting (for the badge). */
export async function countOpenReports() {
    if (!(await adminId())) return 0;
    return prisma.report.count({ where: { status: "open" } });
}
