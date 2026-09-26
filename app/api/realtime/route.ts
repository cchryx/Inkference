import { getSession } from "@/lib/session";
import { subscribe, type RealtimeEvent } from "@/lib/realtime";

// One long-lived connection per open tab (Server-Sent Events). The browser's
// EventSource reconnects by itself if it drops.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return new Response("Unauthorized", { status: 401 });
    const userId = session.user.id;
    const encoder = new TextEncoder();
    let cleanup = () => {};

    const stream = new ReadableStream({
        start(controller) {
            const send = (chunk: string) => {
                try {
                    controller.enqueue(encoder.encode(chunk));
                } catch {
                    cleanup();
                }
            };
            send("retry: 3000\n\n");
            send(`event: ready\ndata: {}\n\n`);

            const unsubscribe = subscribe(userId, (event: RealtimeEvent) => {
                send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
            });
            // Keeps the connection (and proxies) from timing out.
            const ping = setInterval(() => send(": ping\n\n"), 20_000);

            cleanup = () => {
                clearInterval(ping);
                unsubscribe();
                try {
                    controller.close();
                } catch {
                    // already closed
                }
            };
            req.signal.addEventListener("abort", () => cleanup());
        },
        cancel() {
            cleanup();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            // no-transform: stops compression from holding messages back
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
