import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/visibility";
import { sendPushToUsers } from "@/lib/push";
import { publish, type MessageDTO, type RealtimeEvent } from "@/lib/realtime";
import { notify } from "@/lib/notify";

// Server-only helpers for messages (the actions call these).

export const MESSAGE_SETTINGS = ["EVERYONE", "FOLLOWING", "FRIENDS", "NOBODY"] as const;
export type MessageSetting = (typeof MESSAGE_SETTINGS)[number];
export const MAX_GROUP = 50;
export const MAX_TEXT = 4000;

/**
 * Can `from` message `to`?
 *  direct  : straight into their chats
 *  request : lands in their Requests
 *  closed  : not allowed (blocked, or they don't take requests)
 */
export async function messageAccess(from: string, to: string): Promise<"direct" | "request" | "closed"> {
    if (from === to) return "closed";
    const [ctx, privacy] = await Promise.all([
        getViewerContext(to),
        prisma.privacySettings.findUnique({ where: { userId: to }, select: { messagesFrom: true, messageRequests: true } }),
    ]);
    if (ctx.blocked.includes(from)) return "closed";
    const setting = (privacy?.messagesFrom ?? "FRIENDS") as MessageSetting;
    const allowRequests = privacy?.messageRequests ?? true;
    const direct =
        setting === "EVERYONE" ||
        (setting === "FRIENDS" && ctx.friends.includes(from)) ||
        (setting === "FOLLOWING" && (ctx.friends.includes(from) || ctx.following.includes(from)));
    if (direct) return "direct";
    return allowRequests && setting !== "NOBODY" ? "request" : "closed";
}

export const dmKeyFor = (a: string, b: string) => [a, b].sort().join(":");

export function toDTO(m: {
    id: string;
    conversationId: string;
    senderId: string | null;
    kind: string;
    text: string;
    createdAt: Date;
    deletedAt: Date | null;
}): MessageDTO {
    return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        kind: m.kind,
        text: m.deletedAt ? "" : m.text,
        createdAt: m.createdAt.toISOString(),
        deleted: !!m.deletedAt,
    };
}

/** Everyone still in the chat (not people who left). */
export async function memberIds(conversationId: string) {
    const rows = await prisma.conversationMember.findMany({
        where: { conversationId, status: { in: ["active", "request"] } },
        select: { userId: true },
    });
    return rows.map((r) => r.userId);
}

export async function tellMembers(conversationId: string, event: RealtimeEvent, except?: string) {
    const ids = await memberIds(conversationId);
    publish(
        ids.filter((id) => id !== except),
        event
    );
}

/** Adds a grey system line to a chat ("Sam added Alex") and tells everyone. */
export async function systemLine(conversationId: string, text: string) {
    const m = await prisma.message.create({ data: { conversationId, kind: "system", text: text.slice(0, 300) } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: m.createdAt } });
    await tellMembers(conversationId, { type: "message", conversationId, message: toDTO(m) });
}

/** Sends a new message to everyone in the chat, each with their own pop-up info (muted? request?). */
export async function broadcastMessage(
    conversationId: string,
    message: MessageDTO,
    sender: { name: string; image: string | null }
) {
    const [rows, convo] = await Promise.all([
        prisma.conversationMember.findMany({
            where: { conversationId, status: { in: ["active", "request"] } },
            select: { userId: true, muted: true, status: true },
        }),
        prisma.conversation.findUnique({ where: { id: conversationId }, select: { isGroup: true, name: true } }),
    ]);
    const group = convo?.isGroup ? convo.name || "Group chat" : null;
    for (const r of rows) {
        publish([r.userId], {
            type: "message",
            conversationId,
            message,
            alert: { from: sender.name, image: sender.image, group, muted: r.muted, request: r.status === "request" },
        });
    }
}

/**
 * Phone/computer push for a new message (not for muted chats, not for requests:
 * those get a "message request" notification instead). If the app is open and
 * on screen, the service worker skips it and the in-app pop-up shows instead.
 */
export async function pushNewMessage(conversationId: string, senderId: string, text: string) {
    const [members, sender, convo] = await Promise.all([
        prisma.conversationMember.findMany({
            where: { conversationId, userId: { not: senderId }, status: "active", muted: false },
            select: { userId: true },
        }),
        prisma.user.findUnique({ where: { id: senderId }, select: { name: true, username: true } }),
        prisma.conversation.findUnique({ where: { id: conversationId }, select: { isGroup: true, name: true } }),
    ]);
    if (!members.length) return;
    const who = sender?.name || `@${sender?.username ?? "someone"}`;
    const preview = text.length > 120 ? `${text.slice(0, 119)}…` : text;
    await sendPushToUsers(
        members.map((m) => m.userId),
        {
            title: convo?.isGroup ? convo.name || "Group chat" : who,
            body: convo?.isGroup ? `${who}: ${preview}` : preview,
            url: `/social/messages?c=${conversationId}`,
            tag: `chat:${conversationId}`,
        },
        "message"
    );
}

/**
 * "X sent you a message request" in the Inbox (plus push). Only once until
 * they've seen it, so a burst of messages doesn't spam them.
 */
export async function notifyRequests(conversationId: string, senderId: string, preview: string, onlyUserIds?: string[]) {
    const waiting = await prisma.conversationMember.findMany({
        where: {
            conversationId,
            status: "request",
            userId: onlyUserIds ? { in: onlyUserIds } : { not: senderId },
        },
        select: { userId: true },
    });
    for (const w of waiting) {
        if (w.userId === senderId) continue;
        const existing = await prisma.notification.findUnique({
            where: { recipientId_groupKey: { recipientId: w.userId, groupKey: `message_request:${conversationId}` } },
            select: { read: true },
        });
        if (existing && !existing.read) continue;
        await notify({ recipientId: w.userId, actorId: senderId, type: "message_request", targetId: conversationId, preview });
    }
}
