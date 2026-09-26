// Browser-side push helpers (used by Settings and the background sync).
import { savePushSubscription } from "@/actions/notifications/settings";

// VAPID public key -> the format the browser wants.
export function urlBase64ToUint8Array(base64: string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// The service worker, or null if it isn't running (e.g. in `npm run dev`).
export async function getRegistration() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
    return Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array) {
    if (!a) return true; // browser didn't tell us; assume it's fine
    const x = new Uint8Array(a);
    return x.length === b.length && x.every((v, i) => v === b[i]);
}

export async function subscribeThisDevice(reg: ServiceWorkerRegistration, key: string) {
    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
    });
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    const { error } = await savePushSubscription({ ...json, userAgent: navigator.userAgent });
    if (error) throw new Error(error);
    return sub;
}

/**
 * Makes sure this device's push signup is still good and known to the
 * server. Fixes the two silent failures:
 *  - the server lost this device (e.g. database reset, or signed in as
 *    someone else on this phone)  -> saves it again
 *  - the VAPID keys changed since it signed up -> signs up again
 * Returns true if push is on for this device.
 */
export async function syncPushSubscription() {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key || typeof Notification === "undefined" || Notification.permission !== "granted") return false;

    const reg = await getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    try {
        if (!sameKey(sub.options.applicationServerKey, urlBase64ToUint8Array(key))) {
            await sub.unsubscribe();
            await subscribeThisDevice(reg, key);
            return true;
        }
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await savePushSubscription({ ...json, userAgent: navigator.userAgent });
        return true;
    } catch (err) {
        console.error("push sync failed:", err);
        return false;
    }
}
