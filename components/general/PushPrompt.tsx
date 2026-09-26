"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { getRegistration, subscribeThisDevice } from "@/lib/pushClient";

const FLAG = "push-prompted";

function alreadyAsked() {
    try {
        return !!localStorage.getItem(FLAG);
    } catch {
        return true; // can't remember the answer, so don't nag
    }
}

function remember() {
    try {
        localStorage.setItem(FLAG, "1");
    } catch {
        // ignore
    }
}

/**
 * After signing in, asks once per device whether to turn on push
 * notifications. Only shows when this device can actually do push
 * (on iPhone that means the app is added to the Home Screen).
 */
export default function PushPrompt() {
    const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
    const [busy, setBusy] = useState(false);
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    useEffect(() => {
        if (!key || alreadyAsked()) return;
        if (typeof Notification === "undefined" || !("PushManager" in window)) return;
        if (Notification.permission !== "default") return; // already said yes or no

        let cancelled = false;
        // Let the page settle first, so it doesn't pop up mid-load.
        const t = setTimeout(async () => {
            const r = await getRegistration();
            if (!cancelled && r) setReg(r);
        }, 4000);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [key]);

    if (!reg || !key) return null;

    const close = () => {
        remember();
        setReg(null);
    };

    const turnOn = async () => {
        setBusy(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                await subscribeThisDevice(reg, key);
                toast.success("Notifications are on for this device.");
            } else {
                toast("No problem. You can turn them on later in Settings.");
            }
        } catch (err) {
            console.error("push prompt failed:", err);
            toast.error("Couldn't turn on notifications. Try again in Settings.");
        } finally {
            setBusy(false);
            close();
        }
    };

    return (
        <div
            role="dialog"
            aria-label="Turn on notifications"
            className="fixed left-1/2 top-3 z-50 w-[min(92vw,380px)] -translate-x-1/2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2"
        >
            <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Turn on notifications?</p>
                    <p className="text-xs text-gray-600">
                        Get a ping on this device for likes, comments, follows and coffees.
                    </p>
                    <div className="mt-2 flex gap-2">
                        <Button size="sm" className="h-7 cursor-pointer" onClick={turnOn} disabled={busy}>
                            {busy && <Loader size={4} color="text-white" />}
                            Turn on
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 cursor-pointer" onClick={close} disabled={busy}>
                            Not now
                        </Button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
