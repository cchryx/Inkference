"use client";

import { useSyncExternalStore, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { REMIND_OPTIONS } from "@/lib/drive";
import Dropdown from "@/components/general/Dropdown";
import { getRegistration, subscribeThisDevice } from "@/lib/pushClient";

type Props = {
    due: string | null;
    time?: string | null;
    value: number | null | undefined;
    onChange: (remind: number | null) => void;
    /** Smaller version for to-do rows. */
    compact?: boolean;
};

// Does this device currently allow notifications? ("unsupported" on e.g. iPhone Safari outside the app)
function readPermission() {
    if (typeof window === "undefined" || typeof Notification === "undefined" || !("PushManager" in window)) return "unsupported";
    return Notification.permission;
}
const subscribe = (cb: () => void) => {
    window.addEventListener("focus", cb);
    return () => window.removeEventListener("focus", cb);
};

/** "Remind me" dropdown, plus a nudge to turn on notifications if they're off. */
export default function ReminderPicker({ due, time, value, onChange, compact }: Props) {
    const permission = useSyncExternalStore(subscribe, readPermission, () => "default");
    const [, rerender] = useState(0);
    const hasTime = !!time;
    const on = value != null;

    const enablePush = async () => {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        try {
            const result = await Notification.requestPermission();
            if (result !== "granted") return toast("Notifications are blocked. Allow them in your browser settings.");
            const reg = await getRegistration();
            if (!reg || !key) return toast.error("Notifications aren't available here.");
            await subscribeThisDevice(reg, key);
            toast.success("Notifications are on for this device.");
        } catch {
            toast.error("Couldn't turn on notifications.");
        } finally {
            rerender((n) => n + 1);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                {on ? <Bell className="size-3.5 shrink-0 text-gray-600" /> : <BellOff className="size-3.5 shrink-0 text-gray-400" />}
                <Dropdown
                    size={compact ? "sm" : "md"}
                    aria-label="Reminder"
                    disabled={!due}
                    title={due ? "Get a push notification" : "Pick a due date first"}
                    value={value == null ? "" : String(value)}
                    onChange={(v) => onChange(v === "" ? null : Number(v))}
                    className="flex-1"
                    options={[
                        { value: "", label: "No reminder" },
                        ...REMIND_OPTIONS.filter((o) => hasTime || !o.needsTime || o.value === value).map((o) => ({
                            value: String(o.value),
                            label: hasTime ? o.label : o.noTime,
                        })),
                    ]}
                />
            </div>
            {on && permission === "default" && (
                <button
                    type="button"
                    onClick={enablePush}
                    className="w-fit text-left text-xs font-normal normal-case tracking-normal text-sky-700 hover:underline cursor-pointer"
                >
                    Turn on notifications on this device
                </button>
            )}
            {on && permission === "denied" && (
                <p className="text-xs font-normal normal-case tracking-normal text-amber-700">
                    Notifications are blocked on this device. Allow them in your browser settings.
                </p>
            )}
            {on && permission === "unsupported" && (
                <p className="text-xs font-normal normal-case tracking-normal text-gray-500">
                    This browser can&apos;t get notifications. On iPhone, add Inkference to your Home Screen.
                </p>
            )}
        </div>
    );
}
