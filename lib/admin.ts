import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Who is an admin, and who is banned. Server only.

/*
 * Roles, highest first:
 *   ceo    everything, and can make people admin or HR
 *   hr     admin powers, and can add or remove admins
 *   admin  moderation: reports, bans, removing content
 *   user   everyone else
 */
export const ROLES = ["user", "admin", "hr", "ceo"] as const;
export type Role = (typeof ROLES)[number];
const RANK: Record<Role, number> = { user: 0, admin: 1, hr: 2, ceo: 3 };

/** Usernames that are always CEO (comma-separated), e.g. CEO_USERNAMES=cchryx */
const envCeos = () =>
    (process.env.CEO_USERNAMES ?? process.env.ADMIN_USERNAMES ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

export type Account = {
    id: string;
    username: string | null;
    role: string;
    bannedUntil: Date | null;
    banReason: string | null;
};

/** Role and ban info for one person (loaded once per request). */
export const getAccount = cache(async (userId: string): Promise<Account | null> => {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, role: true, bannedUntil: true, banReason: true },
        });
    } catch {
        return null; // columns missing before `prisma db push`: treat as a normal user
    }
});

/** Someone's role (the CEO list in the settings always wins). */
export function roleOf(a: Pick<Account, "role" | "username"> | null | undefined): Role {
    if (!a) return "user";
    if (a.username && envCeos().includes(a.username.toLowerCase())) return "ceo";
    return (ROLES as readonly string[]).includes(a.role) ? (a.role as Role) : "user";
}

export const rankOf = (role: Role) => RANK[role];

export function isAdminAccount(a: Pick<Account, "role" | "username"> | null | undefined) {
    return rankOf(roleOf(a)) >= RANK.admin;
}

/** Roles this person may hand out (HR: admins; CEO: admins and HR). */
export function assignableRoles(actor: Role): Role[] {
    if (actor === "ceo") return ["user", "admin", "hr"];
    if (actor === "hr") return ["user", "admin"];
    return [];
}

/** Can `actor` ban, delete or change `target`? Only people below you (the CEO: anyone else). */
export function canManage(actor: Role, target: Role) {
    return actor === "ceo" ? target !== "ceo" : rankOf(actor) > rankOf(target);
}

export async function isAdminUser(userId: string | null | undefined) {
    return !!userId && isAdminAccount(await getAccount(userId));
}

/** An active ban ({ reason, until }), or null. until = null means forever. */
export function activeBan(a: Pick<Account, "bannedUntil" | "banReason"> | null | undefined) {
    if (!a?.bannedUntil || a.bannedUntil.getTime() <= Date.now()) return null;
    const forever = a.bannedUntil.getFullYear() >= 9000;
    return { reason: a.banReason ?? "No reason given.", until: forever ? null : a.bannedUntil };
}

/** Stored as the ban end for "forever". */
export const FOREVER = new Date("9999-12-31T00:00:00Z");
