import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { notificationText } from "@/lib/notificationText";

/*
 * Creating notifications.
 *
 * Busy things are grouped: every new like on the same post updates ONE
 * notification ("Sam, Alex and 12 others liked your post") instead of
 * sending 14. Once you've read it, the next like starts a fresh group.
 *
 * Nothing here ever throws: a failed notification must never break the
 * like/comment/follow that caused it.
 */

export type NotificationType =
    | "like"
    | "comment"
    | "follow"
    | "friend_request"
    | "friend_accept"
    | "friend_post"
    | "friend_project"
    | "views"
    | "tip"
    | "moderation"
    | "report";

type Target = { targetType?: "post" | "project"; targetId?: string };

// Grouped types add people to the same notification; the rest replace it.
const GROUPED: NotificationType[] = ["like", "comment", "follow"];

const MAX_ACTORS = 3;

// Did this person switch this kind of notification off (Settings)?
async function isInAppOff(userId: string, type: NotificationType) {
    const row = await prisma.notificationSettings.findFirst({
        where: { userId, inAppOff: { has: type } },
        select: { id: true },
    });
    return !!row;
}

// Run after the response is sent, so pushes never slow down a like/comment.
function runAfterResponse(task: () => Promise<void>) {
    try {
        after(task);
    } catch {
        void task(); // not inside a request (shouldn't happen)
    }
}

function linkFor(type: NotificationType, t: Target, actorUsername?: string | null) {
    if (t.targetType === "post" && t.targetId) return `/post/${t.targetId}`;
    if (t.targetType === "project" && t.targetId) return `/project/${t.targetId}`;
    if (type === "friend_request") return "/inbox?tab=requests";
    if (type === "tip") return "/settings?section=payments";
    if (type === "moderation") return "/moderation";
    if (type === "report") return "/admin?tab=reports";
    if (actorUsername) return `/profile/${actorUsername}`;
    return "/inbox";
}

/** Phone/browser push for one notification (respects push settings). */
function pushLater(input: {
    recipientIds: string[];
    actorId: string | null;
    type: NotificationType;
    actorCount: number;
    preview?: string | null;
    groupKey: string;
} & Target) {
    runAfterResponse(async () => {
        const actor = input.actorId
            ? await prisma.user.findUnique({ where: { id: input.actorId }, select: { name: true, username: true } })
            : null;
        await sendPushToUsers(
            input.recipientIds,
            {
                title: "Inkference",
                body: notificationText({
                    type: input.type,
                    actorName: actor?.name ?? actor?.username,
                    actorCount: input.actorCount,
                    preview: input.preview,
                    targetKind: input.targetType ?? null,
                }),
                url: linkFor(input.type, input, actor?.username),
                tag: input.groupKey,
            },
            input.type
        );
    });
}

export function groupKeyFor(type: NotificationType, actorId: string | null, t: Target) {
    switch (type) {
        case "like":
        case "comment":
        case "views":
        case "friend_post":
        case "friend_project":
            return `${type}:${t.targetType}:${t.targetId}`;
        case "follow":
            return "follow";
        case "friend_request":
        case "friend_accept":
            return `${type}:${actorId}`;
        case "tip":
            return `tip:${t.targetId}`; // one per coffee
        case "moderation":
            return `moderation:${t.targetId}`; // one per case
        case "report":
            return `report:${t.targetId}`; // one per reported thing
    }
}

export async function notify(input: {
    recipientId: string; // User.id
    actorId: string | null; // User.id (null for e.g. view milestones)
    type: NotificationType;
    preview?: string | null;
} & Target) {
    const { recipientId, actorId, type, preview, targetType, targetId } = input;
    if (actorId && actorId === recipientId) return; // never notify yourself

    const groupKey = groupKeyFor(type, actorId, { targetType, targetId });
    const where = { recipientId_groupKey: { recipientId, groupKey } };
    const cleanPreview = preview ? preview.slice(0, 200) : null;

    let actorCount = 1;
    try {
        // Switched off in Settings: no Inbox entry (push is decided separately).
        if (await isInAppOff(recipientId, type)) {
            pushLater({ recipientIds: [recipientId], actorId, type, actorCount, preview, groupKey, targetType, targetId });
            return;
        }

        const existing = await prisma.notification.findUnique({ where });

        if (!existing) {
            await prisma.notification.create({
                data: {
                    recipientId,
                    type,
                    groupKey,
                    targetType,
                    targetId,
                    actorIds: actorId ? [actorId] : [],
                    actorCount: actorId ? 1 : 0,
                    preview: cleanPreview,
                },
            });
            pushLater({ recipientIds: [recipientId], actorId, type, actorCount, preview, groupKey, targetType, targetId });
            return;
        }

        const grouped = GROUPED.includes(type) && !existing.read;
        const alreadyIn = !!actorId && existing.actorIds.includes(actorId);

        const updated = await prisma.notification.update({
            where,
            select: { actorCount: true },
            data: {
                read: false,
                preview: cleanPreview ?? existing.preview,
                updatedAt: new Date(), // moves it back to the top
                ...(grouped
                    ? {
                          actorIds: actorId
                              ? [actorId, ...existing.actorIds.filter((a) => a !== actorId)].slice(0, MAX_ACTORS)
                              : existing.actorIds,
                          actorCount: alreadyIn || !actorId ? existing.actorCount : existing.actorCount + 1,
                      }
                    : {
                          actorIds: actorId ? [actorId] : [],
                          actorCount: actorId ? 1 : 0,
                      }),
            },
        });
        actorCount = updated.actorCount;

        // Grouped: only push when someone NEW joins the group (no repeats).
        if (!(grouped && alreadyIn)) {
            pushLater({ recipientIds: [recipientId], actorId, type, actorCount, preview, groupKey, targetType, targetId });
        }
    } catch (err) {
        console.error("notify failed:", err);
    }
}

/** Same notification to many people (e.g. all your friends). */
export async function notifyMany(input: {
    recipientIds: string[];
    actorId: string;
    type: NotificationType;
    preview?: string | null;
} & Target) {
    const { recipientIds, actorId, type, preview, targetType, targetId } = input;
    const recipients = recipientIds.filter((id) => id !== actorId);
    if (recipients.length === 0) return;

    const groupKey = groupKeyFor(type, actorId, { targetType, targetId });
    try {
        // Skip people who switched this kind off in Settings.
        const optedOut = await prisma.notificationSettings.findMany({
            where: { userId: { in: recipients }, inAppOff: { has: type } },
            select: { userId: true },
        });
        const off = new Set(optedOut.map((o) => o.userId));

        await prisma.notification.createMany({
            data: recipients.filter((id) => !off.has(id)).map((recipientId) => ({
                recipientId,
                type,
                groupKey,
                targetType,
                targetId,
                actorIds: [actorId],
                actorCount: 1,
                preview: preview ? preview.slice(0, 200) : null,
            })),
            skipDuplicates: true,
        });

        pushLater({ recipientIds: recipients, actorId, type, actorCount: 1, preview, groupKey, targetType, targetId });
    } catch (err) {
        console.error("notifyMany failed:", err);
    }
}

/** Remove a notification that no longer makes sense (e.g. cancelled request). */
export async function removeNotification(
    recipientId: string,
    type: NotificationType,
    actorId: string | null,
    target: Target = {}
) {
    try {
        await prisma.notification.deleteMany({
            where: { recipientId, groupKey: groupKeyFor(type, actorId, target) },
        });
    } catch (err) {
        console.error("removeNotification failed:", err);
    }
}

/** Tell your friends you posted something new. */
export async function notifyFriends(
    authorUserId: string,
    type: "friend_post" | "friend_project",
    target: Required<Target>,
    preview?: string | null
) {
    try {
        const [rel, privacy] = await Promise.all([
            prisma.relationships.findUnique({
                where: { userId: authorUserId },
                select: { friends: { select: { userId: true } } },
            }),
            prisma.privacySettings.findUnique({
                where: { userId: authorUserId },
                select: { defaultVisibility: true, hiddenFrom: true },
            }),
        ]);
        // Respect privacy: nobody is told about a private post, and people
        // on the "hidden from" list aren't told either.
        if (privacy?.defaultVisibility === "PRIVATE") return;
        const hidden = new Set(privacy?.hiddenFrom ?? []);
        const friendIds = (rel?.friends.map((f) => f.userId) ?? []).filter((id) => !hidden.has(id));
        await notifyMany({ recipientIds: friendIds, actorId: authorUserId, type, preview, ...target });
    } catch (err) {
        console.error("notifyFriends failed:", err);
    }
}

// Views are too frequent to notify one by one, so only milestones count.
const VIEW_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

/**
 * After new views are recorded, notify owners whose item just reached a
 * milestone ("Your post reached 100 views").
 */
export async function notifyViewMilestones(targetType: "post" | "project", ids: string[]) {
    if (ids.length === 0) return;
    try {
        const rows =
            targetType === "post"
                ? await prisma.post.findMany({
                      where: { id: { in: ids } },
                      select: { id: true, userData: { select: { userId: true } }, _count: { select: { views: true } } },
                  })
                : await prisma.project.findMany({
                      where: { id: { in: ids } },
                      select: { id: true, userData: { select: { userId: true } }, _count: { select: { views: true } } },
                  });

        await Promise.all(
            rows
                .filter((r) => VIEW_MILESTONES.includes(r._count.views))
                .map((r) =>
                    notify({
                        recipientId: r.userData.userId,
                        actorId: null,
                        type: "views",
                        targetType,
                        targetId: r.id,
                        preview: String(r._count.views),
                    })
                )
        );
    } catch (err) {
        console.error("notifyViewMilestones failed:", err);
    }
}
