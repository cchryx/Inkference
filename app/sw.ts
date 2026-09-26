import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // Live updates stream: never cache it or wrap it.
        { matcher: ({ url }) => url.pathname.startsWith("/api/realtime"), handler: new NetworkOnly() },
        ...defaultCache,
    ],
    fallbacks: {
        entries: [
            {
                // Show the offline page when a page can't load.
                url: "/~offline",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

serwist.addEventListeners();

// ---------- Push notifications ----------

// Show a notification when the server sends a push.
self.addEventListener("push", (event) => {
    let data: { title?: string; body?: string; url?: string; tag?: string } = {};
    try {
        data = event.data?.json() ?? {};
    } catch {
        data = { body: event.data?.text() };
    }

    event.waitUntil(
        (async () => {
            // Chat messages: if the app is open on screen, it already shows its own pop-up.
            if (data.tag?.startsWith("chat:")) {
                const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
                if (windows.some((w) => w.visibilityState === "visible")) return;
            }
            await self.registration.showNotification(data.title || "Inkference", {
                body: data.body,
                icon: "/icon512_rounded.png",
                badge: "/assets/brand/logo-mark-white.png",
                tag: data.tag, // same tag replaces the old one instead of stacking
                data: { url: data.url || "/inbox" },
            });
        })()
    );
});

// Tapping the notification opens (or focuses) the app on the right page.
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            for (const client of windows) {
                if (client.url.startsWith(self.location.origin) && "focus" in client) {
                    await client.focus();
                    if ("navigate" in client) await client.navigate(url);
                    return;
                }
            }
            await self.clients.openWindow(url);
        })()
    );
});
