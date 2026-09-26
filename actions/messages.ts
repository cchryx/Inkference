"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { publish, type MessageDTO } from "@/lib/realtime";
import {
    MAX_GROUP,
    MAX_TEXT,
    REQUEST_LIMIT,
    takeSendSlot,
    MESSAGE_SETTINGS,
    dmKeyFor,
    memberIds,
    messageAccess,
    pushNewMessage,
    broadcastMessage,
    notifyRequests,
    systemLine,
    tellMembers,
    toDTO,
    type MessageSetting,
} from "@/lib/messaging";

// Everything here only works on chats you're in.

async function me() {
    const session = await getSession();
    return session
        ? { id: session.user.id, name: session.user.name || `@${session.user.username}`, image: session.user.image ?? null }
        : null;
}

async function myMembership(conversationId: string, userId: string) {
    return prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
        include: { conversation: { select: { id: true, isGroup: true, name: true, createdById: true } } },
    });
}

const userSelect = { id: true, name: true, username: true, image: true } as const;
type MiniUser = { id: string; name: string; username: string | null; image: string | null };

// ---------------- List ----------------

export type ConversationSummary = {
    id: string;
    isGroup: boolean;
    title: string;
    people: MiniUser[]; // everyone else (for avatars)
    last: { text: string; senderId: string | null; kind: string; deleted: boolean; createdAt: string } | null;
    lastMessageAt: string;
    unread: number;
    muted: boolean;
    status: string; // active | request
};

/** Your chats ("inbox") or message requests. Newest first. */
export async function listConversations(folder: "inbox" | "requests" = "inbox"): Promise<ConversationSummary[]> {
    const user = await me();
    if (!user) return [];
    const mine = await prisma.conversationMember.findMany({
        where: { userId: user.id, status: folder === "inbox" ? "active" : "request" },
        select: {
            lastReadAt: true,
            hiddenAt: true,
            muted: true,
            status: true,
            conversation: {
                select: {
                    id: true,
                    isGroup: true,
                    name: true,
                    lastMessageAt: true,
                    members: {
                        where: { userId: { not: user.id } },
                        select: { userId: true, status: true },
                        orderBy: { joinedAt: "asc" },
                        take: 12,
                    },
                    messages: { orderBy: { createdAt: "desc" }, take: 1 },
                },
            },
        },
        orderBy: { conversation: { lastMessageAt: "desc" } },
        take: 200,
    });

    // Hidden ("deleted for me") until someone sends something new.
    const visible = mine
        .filter((m) => !m.hiddenAt || m.conversation.lastMessageAt > m.hiddenAt)
        // Groups: only people still in it. 1-on-1: always the other person.
        .map((m) => ({
            ...m,
            conversation: {
                ...m.conversation,
                members: (m.conversation.isGroup
                    ? m.conversation.members.filter((x) => x.status !== "left")
                    : m.conversation.members
                ).slice(0, 6),
            },
        }));
    const people = await prisma.user.findMany({
        where: { id: { in: [...new Set(visible.flatMap((m) => m.conversation.members.map((x) => x.userId)))] } },
        select: userSelect,
    });
    const byId = new Map(people.map((p) => [p.id, p]));

    return Promise.all(
        visible.map(async (m) => {
            const c = m.conversation;
            const others = c.members.map((x) => byId.get(x.userId)).filter((p): p is MiniUser => !!p);
            const unread = await prisma.message.count({
                where: {
                    conversationId: c.id,
                    senderId: { not: user.id },
                    kind: "text",
                    ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
                },
            });
            const last = c.messages[0];
            return {
                id: c.id,
                isGroup: c.isGroup,
                title: c.isGroup
                    ? c.name || others.map((o) => o.name.split(" ")[0]).join(", ") || "Group"
                    : others[0]?.name || "Deleted user",
                people: others,
                last: last
                    ? {
                          text: last.deletedAt ? "" : last.text.slice(0, 120),
                          senderId: last.senderId,
                          kind: last.kind,
                          deleted: !!last.deletedAt,
                          createdAt: last.createdAt.toISOString(),
                      }
                    : null,
                lastMessageAt: c.lastMessageAt.toISOString(),
                unread: Math.min(unread, 99),
                muted: m.muted,
                status: m.status,
            };
        })
    );
}

/** For the badge: chats with unread messages, and waiting requests. */
export async function getMessageCounts() {
    const user = await me();
    if (!user) return { chats: 0, requests: 0 };
    const mine = await prisma.conversationMember.findMany({
        where: { userId: user.id, status: { in: ["active", "request"] } },
        select: { conversationId: true, lastReadAt: true, muted: true, status: true, hiddenAt: true },
        take: 300,
    });
    let chats = 0;
    let requests = 0;
    await Promise.all(
        mine.map(async (m) => {
            const n = await prisma.message.count({
                where: {
                    conversationId: m.conversationId,
                    senderId: { not: user.id },
                    kind: "text",
                    ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
                },
                take: 1,
            });
            if (!n) return;
            if (m.status === "request") requests++;
            else if (!m.muted) chats++;
        })
    );
    return { chats, requests };
}

// ---------------- One chat ----------------

export type ConversationDetail = {
    id: string;
    isGroup: boolean;
    title: string;
    /** The group's own name (null = none set). */
    name: string | null;
    myRole: string;
    myStatus: string;
    muted: boolean;
    members: (MiniUser & { role: string; status: string; lastReadAt: string | null })[];
    /** 1-on-1: can you send? (false if either of you blocked the other) */
    canSend: boolean;
    /** 1-on-1 request you sent that isn't accepted yet: messages you have left (else null). */
    requestLeft: number | null;
    maxText: number;
};

export async function getConversation(conversationId: string): Promise<ConversationDetail | null> {
    const user = await me();
    if (!user) return null;
    const mine = await myMembership(conversationId, user.id);
    if (!mine || mine.status === "left") return null;

    const all = await prisma.conversationMember.findMany({
        where: { conversationId },
        select: { userId: true, role: true, status: true, lastReadAt: true, joinedAt: true },
        orderBy: { joinedAt: "asc" },
    });
    // Groups: people still in it. 1-on-1: the other person always shows, and if they
    // deleted your request it still looks "not accepted" to you (they aren't told).
    const members = mine.conversation.isGroup
        ? all.filter((m) => m.status !== "left")
        : all.map((m) => (m.userId !== user.id && m.status === "left" ? { ...m, status: "request", deletedRequest: true } : m));
    const users = await prisma.user.findMany({ where: { id: { in: members.map((m) => m.userId) } }, select: userSelect });
    const byId = new Map(users.map((u) => [u.id, u]));
    const list = members
        .map((m) => {
            const u = byId.get(m.userId);
            return u ? { ...u, role: m.role, status: m.status, lastReadAt: m.lastReadAt?.toISOString() ?? null } : null;
        })
        .filter((m): m is NonNullable<typeof m> => !!m);
    const others = list.filter((m) => m.id !== user.id);

    let canSend = true;
    if (!mine.conversation.isGroup && others[0]) {
        canSend = (await messageAccess(user.id, others[0].id)) !== "closed" || mine.status === "active";
        // Blocked either way always stops it.
        const blocked = await prisma.relationships.count({
            where: {
                OR: [
                    { userId: user.id, blockedUsers: { some: { userId: others[0].id } } },
                    { userId: others[0].id, blockedUsers: { some: { userId: user.id } } },
                ],
            },
        });
        if (blocked) canSend = false;
    }

    let requestLeft: number | null = null;
    const otherRow = !mine.conversation.isGroup ? members.find((m) => m.userId !== user.id) : undefined;
    if (otherRow && otherRow.status === "request" && mine.status === "active") {
        if ("deletedRequest" in otherRow) {
            requestLeft = REQUEST_LIMIT; // your next message starts a fresh request
        } else {
            const count = await prisma.message.count({
                where: { conversationId, senderId: user.id, kind: "text", createdAt: { gte: otherRow.joinedAt } },
            });
            requestLeft = Math.max(0, REQUEST_LIMIT - count);
        }
    }

    return {
        id: conversationId,
        isGroup: mine.conversation.isGroup,
        title: mine.conversation.isGroup
            ? mine.conversation.name || others.map((o) => o.name.split(" ")[0]).join(", ") || "Group"
            : others[0]?.name || "Deleted user",
        name: mine.conversation.name,
        myRole: mine.role,
        myStatus: mine.status,
        muted: mine.muted,
        members: list,
        canSend,
        requestLeft,
        maxText: MAX_TEXT,
    };
}

const PAGE = 40;

/** Messages, newest first, 40 at a time (pass the oldest id you have to get older ones). */
export async function getMessages(conversationId: string, before?: string) {
    const user = await me();
    if (!user) return { messages: [] as MessageDTO[], hasMore: false };
    const mine = await myMembership(conversationId, user.id);
    if (!mine || mine.status === "left") return { messages: [], hasMore: false };

    const rows = await prisma.message.findMany({
        where: { conversationId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE + 1,
        ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    });
    return { messages: rows.slice(0, PAGE).map(toDTO), hasMore: rows.length > PAGE };
}

// ---------------- Starting chats ----------------

/** Opens (or makes) your 1-on-1 chat with someone. */
export async function startDirect(userId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first.", id: null };
    if (userId === user.id) return { error: "That's you.", id: null };
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return { error: "User not found.", id: null };

    const key = dmKeyFor(user.id, userId);
    const existing = await prisma.conversation.findUnique({ where: { dmKey: key }, select: { id: true } });
    if (existing) {
        // Came back to it: make sure it shows for you again.
        await prisma.conversationMember.updateMany({
            where: { conversationId: existing.id, userId: user.id },
            data: { status: "active", hiddenAt: null },
        });
        return { error: null, id: existing.id };
    }

    const access = await messageAccess(user.id, userId);
    if (access === "closed") return { error: "This person isn't taking messages.", id: null };

    const convo = await prisma.conversation.create({
        data: {
            dmKey: key,
            createdById: user.id,
            members: {
                create: [
                    { userId: user.id, status: "active", lastReadAt: new Date() },
                    { userId, status: access === "direct" ? "active" : "request" },
                ],
            },
        },
        select: { id: true },
    });
    return { error: null, id: convo.id };
}

/** Starts a group chat. People who don't take messages from you are left out. */
export async function createGroup(input: { name: string; userIds: string[] }) {
    const user = await me();
    if (!user) return { error: "Sign in first.", id: null, skipped: 0 };
    const ids = [...new Set(input.userIds)].filter((id) => id !== user.id).slice(0, MAX_GROUP - 1);
    if (ids.length < 2) return { error: "Pick at least 2 people for a group.", id: null, skipped: 0 };

    const access = await Promise.all(ids.map(async (id) => ({ id, access: await messageAccess(user.id, id) })));
    const allowed = access.filter((a) => a.access !== "closed");
    if (allowed.length < 1) return { error: "None of them are taking messages from you.", id: null, skipped: ids.length };

    const convo = await prisma.conversation.create({
        data: {
            isGroup: true,
            name: String(input.name ?? "").trim().slice(0, 80) || null,
            createdById: user.id,
            members: {
                create: [
                    { userId: user.id, role: "owner", status: "active", lastReadAt: new Date() },
                    ...allowed.map((a) => ({ userId: a.id, status: a.access === "direct" ? "active" : "request" })),
                ],
            },
        },
        select: { id: true },
    });
    await systemLine(convo.id, `${user.name} created the group`);
    // People who need to accept get told they were added.
    const groupName = String(input.name ?? "").trim().slice(0, 80) || "Group chat";
    after(() => notifyRequests(convo.id, user.id, `group:${groupName}`).catch((err) => console.error(err)));
    return { error: null, id: convo.id, skipped: ids.length - allowed.length };
}

// ---------------- Sending ----------------

export async function sendMessage(conversationId: string, text: string, clientId?: string) {
    const user = await me();
    if (!user) return { error: "Sign in first.", message: null };
    const body = String(text ?? "").trim();
    if (!body) return { error: "Empty message.", message: null };
    if (body.length > MAX_TEXT) return { error: `Messages can be up to ${MAX_TEXT.toLocaleString()} characters.`, message: null };

    const mine = await myMembership(conversationId, user.id);
    if (!mine || mine.status === "left") return { error: "Chat not found.", message: null };

    if (!mine.conversation.isGroup) {
        const other = await prisma.conversationMember.findFirst({
            where: { conversationId, userId: { not: user.id } },
            select: { id: true, userId: true, status: true, joinedAt: true },
        });
        if (other) {
            const access = await messageAccess(user.id, other.userId);
            // You're in each other's chats already = fine (unless blocked).
            if (access === "closed" && (other.status !== "active" || mine.status !== "active")) {
                return { error: "This person isn't taking messages.", message: null };
            }
            if (access === "closed") {
                const blocked = await prisma.relationships.count({
                    where: {
                        OR: [
                            { userId: user.id, blockedUsers: { some: { userId: other.userId } } },
                            { userId: other.userId, blockedUsers: { some: { userId: user.id } } },
                        ],
                    },
                });
                if (blocked) return { error: "You can't message this person.", message: null };
            }
            // They'd deleted a request from you earlier: it comes back as a (fresh) request.
            if (other.status === "left") {
                if (access === "closed") return { error: "This person isn't taking messages.", message: null };
                await prisma.conversationMember.update({
                    where: { id: other.id },
                    data: { status: access === "direct" ? "active" : "request", joinedAt: new Date() },
                });
            } else if (other.status === "request" && mine.status === "active") {
                // Not accepted yet: only a few messages until they do.
                const count = await prisma.message.count({
                    where: { conversationId, senderId: user.id, kind: "text", createdAt: { gte: other.joinedAt } },
                });
                if (count >= REQUEST_LIMIT) {
                    return {
                        error: `You can send ${REQUEST_LIMIT} messages until they accept your request.`,
                        message: null,
                    };
                }
            }
        }
    }

    if (!takeSendSlot(user.id)) return { error: "Slow down a little. Try again in a few seconds.", message: null };

    // Replying to a request accepts it.
    const now = new Date();
    await prisma.conversationMember.update({
        where: { id: mine.id },
        data: { lastReadAt: now, hiddenAt: null, ...(mine.status === "request" ? { status: "active" } : {}) },
    });

    const m = await prisma.message.create({ data: { conversationId, senderId: user.id, text: body } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: m.createdAt } });

    const dto = { ...toDTO(m), clientId };
    await broadcastMessage(conversationId, dto, { name: user.name, image: user.image });
    after(async () => {
        await pushNewMessage(conversationId, user.id, body).catch((err) => console.error("message push failed:", err));
        await notifyRequests(conversationId, user.id, body.slice(0, 120)).catch((err) =>
            console.error("message request notification failed:", err)
        );
    });
    return { error: null, message: dto };
}

/** Unsend one of your own messages. */
export async function unsendMessage(messageId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const m = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true, conversationId: true } });
    if (!m || m.senderId !== user.id) return { error: "You can only unsend your own messages." };
    await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), text: "" } });
    await tellMembers(m.conversationId, { type: "unsent", conversationId: m.conversationId, messageId });
    return { error: null };
}

/** You've seen everything up to now. */
export async function markRead(conversationId: string) {
    const user = await me();
    if (!user) return;
    const now = new Date();
    const { count } = await prisma.conversationMember.updateMany({
        where: { conversationId, userId: user.id, status: { not: "left" } },
        data: { lastReadAt: now },
    });
    if (count) await tellMembers(conversationId, { type: "read", conversationId, userId: user.id, at: now.toISOString() });
}

/** "typing..." (the browser calls this at most every few seconds while you type). */
export async function sendTyping(conversationId: string) {
    const user = await me();
    if (!user) return;
    const ids = await memberIds(conversationId);
    if (!ids.includes(user.id)) return;
    publish(
        ids.filter((id) => id !== user.id),
        { type: "typing", conversationId, userId: user.id, name: user.name }
    );
}

// ---------------- Requests and chat settings ----------------

export async function acceptRequest(conversationId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const { count } = await prisma.conversationMember.updateMany({
        where: { conversationId, userId: user.id, status: "request" },
        data: { status: "active" },
    });
    if (!count) return { error: "Request not found." };
    await tellMembers(conversationId, { type: "conversation", conversationId });
    return { error: null };
}

/** Delete a request (they aren't told). They can send a new one later unless you block them. */
export async function deleteRequest(conversationId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    await prisma.conversationMember.updateMany({
        where: { conversationId, userId: user.id, status: "request" },
        data: { status: "left", hiddenAt: new Date() },
    });
    return { error: null };
}

/** "Delete chat" for yourself: it disappears until a new message comes in. */
export async function hideConversation(conversationId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    await prisma.conversationMember.updateMany({
        where: { conversationId, userId: user.id },
        data: { hiddenAt: new Date(), lastReadAt: new Date() },
    });
    return { error: null };
}

export async function setMuted(conversationId: string, muted: boolean) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    await prisma.conversationMember.updateMany({ where: { conversationId, userId: user.id }, data: { muted: !!muted } });
    return { error: null };
}

// ---------------- Groups ----------------

export async function renameGroup(conversationId: string, name: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const mine = await myMembership(conversationId, user.id);
    if (!mine?.conversation.isGroup || mine.status !== "active") return { error: "Group not found." };
    const clean = String(name ?? "").trim().slice(0, 80);
    await prisma.conversation.update({ where: { id: conversationId }, data: { name: clean || null } });
    await systemLine(conversationId, clean ? `${user.name} named the group "${clean}"` : `${user.name} removed the group name`);
    await tellMembers(conversationId, { type: "conversation", conversationId });
    return { error: null };
}

export async function addToGroup(conversationId: string, userIds: string[]) {
    const user = await me();
    if (!user) return { error: "Sign in first.", skipped: 0 };
    const mine = await myMembership(conversationId, user.id);
    if (!mine?.conversation.isGroup || mine.status !== "active") return { error: "Group not found.", skipped: 0 };

    const current = await prisma.conversationMember.findMany({ where: { conversationId }, select: { userId: true, status: true } });
    const activeCount = current.filter((c) => c.status !== "left").length;
    const inIt = new Set(current.filter((c) => c.status !== "left").map((c) => c.userId));
    const ids = [...new Set(userIds)].filter((id) => !inIt.has(id)).slice(0, Math.max(0, MAX_GROUP - activeCount));
    let added = 0;
    const names: string[] = [];
    const addedIds: string[] = [];
    for (const id of ids) {
        const access = await messageAccess(user.id, id);
        if (access === "closed") continue;
        await prisma.conversationMember.upsert({
            where: { conversationId_userId: { conversationId, userId: id } },
            update: { status: access === "direct" ? "active" : "request", role: "member", hiddenAt: null },
            create: { conversationId, userId: id, status: access === "direct" ? "active" : "request" },
        });
        const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
        names.push(u?.name ?? "someone");
        addedIds.push(id);
        added++;
    }
    if (added) {
        await systemLine(conversationId, `${user.name} added ${names.join(", ")}`);
        const groupName = mine.conversation.name || "Group chat";
        after(() =>
            notifyRequests(conversationId, user.id, `group:${groupName}`, addedIds).catch((err) => console.error(err))
        );
        await tellMembers(conversationId, { type: "conversation", conversationId });
    }
    return { error: null, skipped: ids.length - added };
}

/** The group owner removes someone. */
export async function removeFromGroup(conversationId: string, userId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const mine = await myMembership(conversationId, user.id);
    if (!mine?.conversation.isGroup || mine.role !== "owner") return { error: "Only the group owner can remove people." };
    if (userId === user.id) return { error: "Use Leave group instead." };
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.conversationMember.updateMany({ where: { conversationId, userId }, data: { status: "left" } });
    await systemLine(conversationId, `${user.name} removed ${u?.name ?? "someone"}`);
    publish([userId], { type: "conversation", conversationId });
    await tellMembers(conversationId, { type: "conversation", conversationId });
    return { error: null };
}

export async function leaveGroup(conversationId: string) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const mine = await myMembership(conversationId, user.id);
    if (!mine?.conversation.isGroup || mine.status === "left") return { error: "Group not found." };
    await prisma.conversationMember.update({ where: { id: mine.id }, data: { status: "left", role: "member" } });
    // The owner left: the longest-standing member takes over.
    if (mine.role === "owner") {
        const next = await prisma.conversationMember.findFirst({
            where: { conversationId, status: "active" },
            orderBy: { joinedAt: "asc" },
        });
        if (next) await prisma.conversationMember.update({ where: { id: next.id }, data: { role: "owner" } });
    }
    await systemLine(conversationId, `${user.name} left the group`);
    await tellMembers(conversationId, { type: "conversation", conversationId });
    return { error: null };
}

// ---------------- Privacy ----------------

export async function getMessagePrivacy() {
    const user = await me();
    if (!user) return null;
    const p = await prisma.privacySettings.findUnique({
        where: { userId: user.id },
        select: { messagesFrom: true, messageRequests: true },
    });
    return { messagesFrom: (p?.messagesFrom ?? "FRIENDS") as MessageSetting, messageRequests: p?.messageRequests ?? true };
}

export async function updateMessagePrivacy(input: { messagesFrom?: MessageSetting; messageRequests?: boolean }) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const data: { messagesFrom?: string; messageRequests?: boolean } = {};
    if (input.messagesFrom) {
        if (!MESSAGE_SETTINGS.includes(input.messagesFrom)) return { error: "Invalid option." };
        data.messagesFrom = input.messagesFrom;
    }
    if (typeof input.messageRequests === "boolean") data.messageRequests = input.messageRequests;
    await prisma.privacySettings.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
    return { error: null };
}

/** Can I message this person? (For the "Message" button on profiles.) */
export async function getMessageAccess(userId: string) {
    const user = await me();
    if (!user || user.id === userId) return "closed" as const;
    const existing = await prisma.conversation.findUnique({ where: { dmKey: dmKeyFor(user.id, userId) }, select: { id: true } });
    if (existing) return "direct" as const;
    return messageAccess(user.id, userId);
}
