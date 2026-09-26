"use client";

import { useEffect } from "react";
import { syncPushSubscription } from "@/lib/pushClient";
import { saveTimeZone } from "@/actions/preferences";

/** Tells the server your timezone when it's new or changed (for reminders). */
function syncTimeZone() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!tz || localStorage.getItem("tz-saved") === tz) return;
        void saveTimeZone(tz).then((r) => !r.error && localStorage.setItem("tz-saved", tz));
    } catch {
        // storage blocked: skip
    }
}

/**
 * Once per visit, quietly checks that this device is still signed up for
 * push (and re-registers it if not). Renders nothing.
 */
export default function PushSync() {
    useEffect(() => {
        try {
            if (sessionStorage.getItem("push-synced")) return;
            sessionStorage.setItem("push-synced", "1");
        } catch {
            // storage blocked: just sync anyway
        }
        // Give the page a moment to load first.
        const t = setTimeout(() => {
            void syncPushSubscription();
            syncTimeZone();
        }, 3000);
        return () => clearTimeout(t);
    }, []);
    return null;
}
