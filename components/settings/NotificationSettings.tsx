"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import {
    deletePushSubscription,
    getNotificationSettings,
    sendTestPush,
    updateNotificationSettings,
} from "@/actions/notifications/settings";
import { getRegistration, subscribeThisDevice, syncPushSubscription } from "@/lib/pushClient";
import { NOTIFICATION_TYPES } from "@/lib/notificationText";

type PushState = "checking" | "unsupported" | "needs-install" | "no-worker" | "denied" | "off" | "on";

const Switch = ({ on, onChange, disabled, label }: { on: boolean; onChange: () => void; disabled?: boolean; label: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
            on ? "bg-neutral-900" : "bg-gray-300"
        }`}
    >
        <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        />
    </button>
);

const NotificationSettings = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["notificationSettings"],
        queryFn: () => getNotificationSettings(),
    });

    const [pushState, setPushState] = useState<PushState>("checking");
    const [busy, setBusy] = useState(false);
    const [saving, setSaving] = useState(false);

    // Work out whether push can be used on this device, and if it's on.
    useEffect(() => {
        (async () => {
            const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const installed =
                window.matchMedia("(display-mode: standalone)").matches ||
                (navigator as Navigator & { standalone?: boolean }).standalone === true;

            if (!supported) return setPushState(isIOS && !installed ? "needs-install" : "unsupported");
            if (Notification.permission === "denied") return setPushState("denied");

            const reg = await getRegistration();
            if (!reg) return setPushState("no-worker");
            // Also re-registers this device with the server if needed.
            setPushState((await syncPushSubscription()) ? "on" : "off");
        })();
    }, []);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["notificationSettings"] });

    const enablePush = async () => {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return toast.error("Push isn't set up on the server yet (missing VAPID keys).");

        setBusy(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setPushState(permission === "denied" ? "denied" : "off");
                return;
            }
            const reg = await getRegistration();
            if (!reg) return setPushState("no-worker");

            // Start clean, in case an old signup with other keys is stuck.
            await (await reg.pushManager.getSubscription())?.unsubscribe();
            await subscribeThisDevice(reg, key);

            setPushState("on");
            toast.success("Push notifications are on for this device.");
            refresh();
        } catch (err) {
            console.error(err);
            toast.error("Couldn't turn on push notifications.");
        } finally {
            setBusy(false);
        }
    };

    const disablePush = async () => {
        setBusy(true);
        try {
            const reg = await getRegistration();
            const sub = await reg?.pushManager.getSubscription();
            if (sub) {
                await deletePushSubscription(sub.endpoint);
                await sub.unsubscribe();
            }
            setPushState("off");
            toast.success("Push notifications are off for this device.");
            refresh();
        } finally {
            setBusy(false);
        }
    };

    const test = async () => {
        setBusy(true);
        // Make sure the server knows this device before testing.
        await syncPushSubscription();
        const { error, report } = await sendTestPush();
        setBusy(false);
        refresh();

        if (error || !report) return toast.error(error ?? "Couldn't send a test.");
        if (!report.configured) {
            return toast.error("The server is missing its VAPID keys, so it can't send pushes. Add them on Render.");
        }
        if (report.devices === 0) {
            return toast.error("No devices are signed up. Turn push off and on again on this device.");
        }
        if (report.keyMismatch > 0) {
            setPushState("off");
            return toast.error("This device signed up with old keys. Turn push on again to fix it.");
        }
        if (report.sent === 0) {
            return toast.error("The push service rejected it. Try turning push off and on again.");
        }
        toast.success(
            `Sent to ${report.sent} device${report.sent > 1 ? "s" : ""}. Nothing showing? Check your phone's notification settings and Focus / Do Not Disturb.`
        );
    };

    const toggle = async (list: "inAppOff" | "pushOff", type: string) => {
        if (!data) return;
        const current = new Set(data[list]);
        if (current.has(type)) current.delete(type);
        else current.add(type);

        const next = { inAppOff: data.inAppOff, pushOff: data.pushOff, [list]: [...current] };
        // Update the screen straight away, then save.
        queryClient.setQueryData(["notificationSettings"], { ...data, ...next });
        setSaving(true);
        const { error } = await updateNotificationSettings(next);
        setSaving(false);
        if (error) {
            toast.error(error);
            refresh();
        }
    };

    if (isLoading || !data) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-36 w-full rounded-md" />
                <Skeleton className="h-96 w-full rounded-md" />
            </div>
        );
    }

    const pushOn = pushState === "on";

    return (
        <div className="space-y-5">
            {/* Push on this device */}
            <div className="w-full space-y-4 rounded-md border-2 border-gray-200 p-6">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-2 text-lg font-semibold">
                        <Smartphone className="h-5 w-5 shrink-0" />
                        Push notifications
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Get notified on this phone or computer, even when Inkference is closed.
                    </p>
                </div>

                {pushState === "checking" && <Loader size={5} color="text-gray-500" />}

                {pushState === "needs-install" && (
                    <p className="rounded-md bg-gray-100 p-3 text-sm">
                        On iPhone and iPad, first add Inkference to your Home Screen: tap the Share button, then
                        &ldquo;Add to Home Screen&rdquo;. Open it from there and come back here.
                    </p>
                )}
                {pushState === "unsupported" && (
                    <p className="text-sm text-gray-600">This browser doesn&apos;t support push notifications.</p>
                )}
                {pushState === "no-worker" && (
                    <p className="text-sm text-gray-600">
                        Push needs the app&apos;s service worker, which only runs in the live app (not in development
                        mode). Try again on the deployed site.
                    </p>
                )}
                {pushState === "denied" && (
                    <p className="text-sm text-gray-600">
                        Notifications are blocked for this site. Allow them in your browser or phone settings, then
                        reload this page.
                    </p>
                )}
                {!data.pushConfigured && (pushState === "off" || pushState === "on") && (
                    <p className="text-sm text-amber-700">Push isn&apos;t configured on the server yet (VAPID keys missing).</p>
                )}

                {(pushState === "off" || pushState === "on") && (
                    <div className="flex flex-wrap items-center gap-2">
                        {pushOn ? (
                            <>
                                <Button variant="outline" onClick={disablePush} disabled={busy} className="cursor-pointer">
                                    {busy && <Loader size={4} color="text-gray-500" />}
                                    Turn off on this device
                                </Button>
                                <Button onClick={test} disabled={busy} className="cursor-pointer">
                                    <BellRing className="h-4 w-4" /> Send a test
                                </Button>
                            </>
                        ) : (
                            <Button onClick={enablePush} disabled={busy || !data.pushConfigured} className="cursor-pointer">
                                {busy && <Loader size={4} />}
                                Turn on for this device
                            </Button>
                        )}
                        <span className="text-xs text-gray-500">
                            {data.pushDevices} device{data.pushDevices === 1 ? "" : "s"} signed up
                        </span>
                    </div>
                )}
            </div>

            {/* Per type */}
            <div className="w-full space-y-4 rounded-md border-2 border-gray-200 p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-lg font-semibold">What to notify me about</h1>
                        <p className="text-sm text-muted-foreground">
                            &ldquo;In app&rdquo; is your Inbox. &ldquo;Push&rdquo; is your phone or computer.
                        </p>
                    </div>
                    {saving && <Loader size={4} color="text-gray-500" />}
                </div>

                <div className="divide-y rounded-md border">
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <span className="flex-1">Type</span>
                        <span className="w-11 text-center">In app</span>
                        <span className="w-11 text-center">Push</span>
                    </div>
                    {NOTIFICATION_TYPES.map(({ type, label, hint }) => (
                        <div key={type} className="flex items-center gap-3 px-3 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-gray-500">{hint}</p>
                            </div>
                            <Switch
                                label={`${label} in app`}
                                on={!data.inAppOff.includes(type)}
                                onChange={() => toggle("inAppOff", type)}
                            />
                            <Switch
                                label={`${label} push`}
                                on={!data.pushOff.includes(type)}
                                onChange={() => toggle("pushOff", type)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
