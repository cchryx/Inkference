"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AUDIENCES, VISIBILITIES, type Audience, type Visibility } from "@/lib/visibility";
import { getSession } from "@/lib/session";

async function me() {
    const session = await getSession();
    return session?.user?.id ?? null;
}

const userSelect = { id: true, name: true, username: true, image: true } as const;

/** Basic info for a list of user ids (for showing picked people). */
export async function getUsersByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.user.findMany({ where: { id: { in: ids.slice(0, 200) } }, select: userSelect });
}

/** Everything the Privacy settings tab needs. */
export async function getPrivacySettings() {
    const userId = await me();
    if (!userId) return null;

    const [settings, rel] = await Promise.all([
        prisma.privacySettings.findUnique({ where: { userId } }),
        prisma.relationships.findUnique({
            where: { userId },
            select: { blockedUsers: { select: { user: { select: userSelect } } } },
        }),
    ]);

    return {
        defaultVisibility: (settings?.defaultVisibility ?? "PUBLIC") as Audience,
        hiddenFrom: await getUsersByIds(settings?.hiddenFrom ?? []),
        blocked: rel?.blockedUsers.map((b) => b.user) ?? [],
    };
}

export async function updateDefaultVisibility(level: Audience) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    if (!AUDIENCES.includes(level)) return { error: "Invalid option." };

    await prisma.privacySettings.upsert({
        where: { userId },
        update: { defaultVisibility: level },
        create: { userId, defaultVisibility: level },
    });
    return { error: null };
}

/** People who can't see any of your posts, projects or galleries. */
export async function updateHiddenFrom(userIds: string[]) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };

    const ids = [...new Set(userIds)].filter((id) => id !== userId).slice(0, 500);
    await prisma.privacySettings.upsert({
        where: { userId },
        update: { hiddenFrom: ids },
        create: { userId, hiddenFrom: ids },
    });
    return { error: null };
}

type ContentKind = "post" | "project" | "gallery";

/** Current "who can see this" for one of your posts/projects/galleries. */
export async function getContentVisibility(kind: ContentKind, id: string) {
    const userId = await me();
    if (!userId) return null;

    const select = {
        visibility: true,
        allowedUserIds: true,
        hiddenFromUserIds: true,
        userData: { select: { userId: true } },
    } as const;
    const row =
        kind === "post"
            ? await prisma.post.findUnique({ where: { id }, select })
            : kind === "project"
              ? await prisma.project.findUnique({ where: { id }, select })
              : await prisma.gallery.findUnique({ where: { id }, select });
    if (!row || row.userData.userId !== userId) return null;

    const [allowed, hidden, settings] = await Promise.all([
        getUsersByIds(row.allowedUserIds),
        getUsersByIds(row.hiddenFromUserIds),
        prisma.privacySettings.findUnique({ where: { userId }, select: { defaultVisibility: true } }),
    ]);

    return {
        visibility: row.visibility as Visibility,
        defaultVisibility: (settings?.defaultVisibility ?? "PUBLIC") as Audience,
        allowed,
        hidden,
    };
}

/** Change "who can see this" for one item (overrides your default). */
export async function updateContentVisibility(
    kind: ContentKind,
    id: string,
    input: { visibility: Visibility; allowedUserIds: string[]; hiddenFromUserIds: string[] }
) {
    const userId = await me();
    if (!userId) return { error: "Sign in first." };
    if (!VISIBILITIES.includes(input.visibility)) return { error: "Invalid option." };

    const data = {
        visibility: input.visibility,
        allowedUserIds: [...new Set(input.allowedUserIds)].slice(0, 500),
        hiddenFromUserIds: [...new Set(input.hiddenFromUserIds)].slice(0, 500),
    };
    if (data.visibility === "CUSTOM" && data.allowedUserIds.length === 0) {
        return { error: "Pick at least one person, or choose another option." };
    }

    // Only the owner can change it.
    const owner = { userData: { userId } };
    const result =
        kind === "post"
            ? await prisma.post.updateMany({ where: { id, ...owner }, data })
            : kind === "project"
              ? await prisma.project.updateMany({ where: { id, ...owner }, data })
              : await prisma.gallery.updateMany({ where: { id, ...owner }, data });

    if (result.count === 0) return { error: "Not found." };

    revalidatePath(kind === "post" ? `/post/${id}` : kind === "project" ? `/project/${id}` : `/gallery/${id}`);
    return { error: null };
}
