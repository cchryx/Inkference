"use client";

import { useEffect } from "react";
import { syncPushSubscription } from "@/lib/pushClient";

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
        const t = setTimeout(() => void syncPushSubscription(), 3000);
        return () => clearTimeout(t);
    }, []);
    return null;
}
