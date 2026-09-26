// Live updates (server side). Each open tab keeps one connection to
// /api/realtime; anything that happens (a new message, "seen", "typing...")
// is pushed straight down it, so nothing needs a refresh.
//
// It lives in memory on this server. That's right for one server (Render's
// plan). With several servers, this would move to Postgres LISTEN/NOTIFY.

export type MessageDTO = {
    id: string;
    conversationId: string;
    senderId: string | null;
    kind: string;
    text: string;
    createdAt: string;
    deleted: boolean;
    clientId?: string;
};

/** Extra info for the little in-app pop-up ("Sam: hey"). Per person (their own mute/request state). */
export type MessageAlert = {
    from: string;
    image: string | null;
    group: string | null; // group name, or null for a 1-on-1
    muted: boolean;
    request: boolean;
};

export type RealtimeEvent =
    | { type: "message"; conversationId: string; message: MessageDTO; alert?: MessageAlert }
    | { type: "unsent"; conversationId: string; messageId: string }
    | { type: "read"; conversationId: string; userId: string; at: string }
    | { type: "typing"; conversationId: string; userId: string; name: string }
    | { type: "conversation"; conversationId: string }; // list/details changed: refetch

type Listener = (event: RealtimeEvent) => void;

// Kept on globalThis so API routes and server actions share one hub
// (and hot reloads in development don't lose it).
const g = globalThis as unknown as { __inkRealtime?: Map<string, Set<Listener>> };
const listeners = (g.__inkRealtime ??= new Map());

export function subscribe(userId: string, fn: Listener) {
    let set = listeners.get(userId);
    if (!set) listeners.set(userId, (set = new Set()));
    set.add(fn);
    return () => {
        set!.delete(fn);
        if (set!.size === 0) listeners.delete(userId);
    };
}

export function publish(userIds: string[], event: RealtimeEvent) {
    for (const id of new Set(userIds)) {
        for (const fn of listeners.get(id) ?? []) {
            try {
                fn(event);
            } catch {
                // a closed tab: its cleanup removes it
            }
        }
    }
}

/** Does this person have the app open right now (any tab)? */
export const isOnline = (userId: string) => (listeners.get(userId)?.size ?? 0) > 0;
