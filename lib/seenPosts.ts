import { markPostsSeen } from "@/actions/feed/fetchHomeFeed";

/*
 * Collects post IDs that were on screen and sends them to the server in
 * batches, so scrolling doesn't fire one request per post.
 */

const queue = new Set<string>();
const sent = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

const BATCH_SIZE = 10;
const FLUSH_DELAY_MS = 3000;

export function flushSeenPosts() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (queue.size === 0) return;

    const ids = [...queue];
    queue.clear();

    markPostsSeen(ids).catch(() => {
        // Let them be retried next time they're on screen.
        ids.forEach((id) => sent.delete(id));
    });
}

export function markSeen(postId: string) {
    if (sent.has(postId)) return;
    sent.add(postId);
    queue.add(postId);

    if (queue.size >= BATCH_SIZE) flushSeenPosts();
    else if (!timer) timer = setTimeout(flushSeenPosts, FLUSH_DELAY_MS);
}

// Send whatever is left when the user switches tabs or closes the app.
if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushSeenPosts();
    });
}
