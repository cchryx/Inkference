"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Coffee, ExternalLink, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { UserIcon } from "@/components/general/UserIcon";
import MoneySplit from "@/components/tips/MoneySplit";
import { getMyPayouts, getMyTips, openPayoutDashboard, setTipsEnabled, startPayoutSetup } from "@/actions/tips/tips";
import { formatMoney, tipBreakdown } from "@/lib/payments/fees";

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full space-y-3 rounded-md border border-gray-200 p-4">{children}</div>
);

/** Settings > Payments: turn on "Buy me a coffee" and see what you've received. */
export default function Payments() {
    const queryClient = useQueryClient();
    const payouts = useQuery({ queryKey: ["myPayouts"], queryFn: () => getMyPayouts() });
    const tips = useQuery({ queryKey: ["myTips"], queryFn: () => getMyTips(), enabled: !!payouts.data?.connected });
    const [busy, setBusy] = useState(false);

    // Back from Stripe's sign-up.
    useEffect(() => {
        const url = new URL(window.location.href);
        const result = url.searchParams.get("payouts");
        if (!result) return;
        if (result === "done") queryClient.invalidateQueries({ queryKey: ["myPayouts"] });
        if (result === "retry") toast.error("That link expired. Press Continue setup to get a new one.");
        url.searchParams.delete("payouts");
        window.history.replaceState(null, "", url);
    }, [queryClient]);

    const go = async (action: () => Promise<{ error: string | null; url: string | null }>) => {
        setBusy(true);
        const { error, url } = await action();
        if (error || !url) {
            setBusy(false);
            return toast.error(error ?? "Something went wrong.");
        }
        window.location.href = url;
    };

    const toggle = async () => {
        if (!payouts.data) return;
        const next = !payouts.data.tipsEnabled;
        queryClient.setQueryData(["myPayouts"], { ...payouts.data, tipsEnabled: next });
        const { error } = await setTipsEnabled(next);
        if (error) {
            toast.error(error);
            queryClient.invalidateQueries({ queryKey: ["myPayouts"] });
        }
    };

    if (payouts.isLoading || !payouts.data) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-64 w-full rounded-md" />
            </div>
        );
    }

    const p = payouts.data;
    const active = p.canReceive && p.setupDone;
    const example = tipBreakdown(500);

    return (
        <div className="space-y-3">
            {/* ---------- Status / setup ---------- */}
            <Card>
                <div className="space-y-1">
                    <h1 className="flex items-center gap-2 text-base font-semibold">
                        <Coffee className="h-5 w-5 shrink-0" /> Buy me a coffee
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Let people support you with a coffee from your profile. The money goes straight to your bank.
                    </p>
                </div>

                {!p.available ? (
                    <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">Coffees aren&apos;t available yet. Check back soon.</p>
                ) : active ? (
                    <div className="space-y-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> You can receive coffees
                            {!p.canPayout && <span className="text-amber-700"> (payouts to your bank are still being verified)</span>}
                        </p>
                        <div className="flex items-center justify-between gap-4 rounded-md bg-gray-100 p-3">
                            <span className="text-sm">
                                <span className="block font-medium">Show the coffee button on my profile</span>
                                <span className="block text-xs text-gray-500">Turn off to pause coffees anytime.</span>
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={p.tipsEnabled}
                                aria-label="Show the coffee button"
                                onClick={toggle}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer ${p.tipsEnabled ? "bg-neutral-900" : "bg-gray-300"}`}
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.tipsEnabled ? "left-[22px]" : "left-0.5"}`} />
                            </button>
                        </div>
                        <Button variant="outline" onClick={() => go(openPayoutDashboard)} disabled={busy} className="cursor-pointer">
                            {busy ? <Loader size={4} color="text-gray-500" /> : <ExternalLink className="h-4 w-4" />}
                            Balance and payouts (Stripe)
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {p.connected && (
                            <p className="flex items-center gap-2 text-sm text-amber-700">
                                <Clock className="h-4 w-4" /> Setup isn&apos;t finished yet.
                            </p>
                        )}
                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                            <li>We send you to Stripe, the payment company, to add your bank and confirm who you are.</li>
                            <li>Stripe keeps those details. Inkference never sees your bank or ID.</li>
                            <li>Once it&apos;s done, a coffee button appears on your profile.</li>
                        </ol>
                        <p className="text-xs text-gray-500">You need to be 18 or older. Stripe may ask for ID.</p>
                        <Button onClick={() => go(startPayoutSetup)} disabled={busy} className="cursor-pointer">
                            {busy ? <Loader size={4} /> : <Wallet className="h-4 w-4" />}
                            {p.connected ? "Continue setup" : "Set up payouts"}
                        </Button>
                    </div>
                )}
            </Card>

            {/* ---------- Where the money goes ---------- */}
            <Card>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">Where the money goes</h2>
                    <p className="text-sm text-muted-foreground">
                        Example: someone buys you a {formatMoney(example.amount)} coffee. The card fee is added on top for them, so it
                        doesn&apos;t come out of your coffee.
                    </p>
                </div>
                <MoneySplit b={example} recipient="you" />
                <p className="text-xs text-gray-500">
                    Stripe then pays your share to your bank on its usual schedule. Stripe&apos;s fees can change; we&apos;ll update this if they do.
                </p>
            </Card>

            {/* ---------- Received ---------- */}
            {p.connected && (
                <Card>
                    <div className="flex items-baseline justify-between gap-3">
                        <h2 className="text-base font-semibold">Coffees received</h2>
                        {tips.data && (
                            <span className="text-sm text-gray-500">
                                {tips.data.count} · {formatMoney(tips.data.totalEarned)} earned
                            </span>
                        )}
                    </div>
                    {tips.isLoading ? (
                        <Skeleton className="h-24 w-full rounded-md" />
                    ) : tips.data?.rows.length ? (
                        <ul className="divide-y divide-gray-200">
                            {tips.data.rows.map((t) => (
                                <li key={t.id} className="flex items-start gap-3 py-3">
                                    <UserIcon image={t.person?.image} size="size-9" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">
                                            <span className="font-semibold">{t.person?.name ?? "Someone"}</span> bought you a{" "}
                                            {formatMoney(t.amount, t.currency)} coffee
                                            {t.status === "refunded" && <span className="text-red-600"> (refunded)</span>}
                                        </p>
                                        {t.message && <p className="mt-0.5 break-words text-sm text-gray-600">&ldquo;{t.message}&rdquo;</p>}
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })} · you got{" "}
                                            {formatMoney(t.toRecipient, t.currency)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No coffees yet. Share your profile so people can find you.</p>
                    )}
                </Card>
            )}
        </div>
    );
}
