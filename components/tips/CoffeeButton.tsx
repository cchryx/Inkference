"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coffee } from "lucide-react";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { createTipCheckout, getTipTarget } from "@/actions/tips/tips";
import { TIP_MAX, TIP_MIN, TIP_PRESETS, formatMoney, tipBreakdown } from "@/lib/payments/fees";
import { useNavigate } from "@/lib/navigation";
import MoneySplit from "./MoneySplit";

type Props = { userId: string; name: string; isOwn: boolean; signedIn: boolean };

/** "Buy me a coffee" on someone's profile. Only shows if they can receive. */
export default function CoffeeButton({ userId, name, isOwn, signedIn }: Props) {
    const navigate = useNavigate();
    const { data } = useQuery({
        queryKey: ["tipTarget", userId],
        queryFn: () => getTipTarget(userId),
        enabled: !isOwn,
        staleTime: 5 * 60_000,
    });
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(TIP_PRESETS[1]);
    const [custom, setCustom] = useState("");
    const [message, setMessage] = useState("");
    const [pending, setPending] = useState(false);

    // Coming back from the payment page.
    useEffect(() => {
        const url = new URL(window.location.href);
        const result = url.searchParams.get("coffee");
        if (!result) return;
        if (result === "thanks") toast.success(`Thanks! Your coffee is on its way to ${name}. ☕`);
        url.searchParams.delete("coffee");
        window.history.replaceState(null, "", url);
    }, [name]);

    if (isOwn || !data?.canTip) return null;

    const customCents = Math.round(parseFloat(custom) * 100);
    const chosen = custom ? customCents : amount;
    const valid = Number.isFinite(chosen) && chosen >= TIP_MIN && chosen <= TIP_MAX;
    const b = tipBreakdown(valid ? chosen : TIP_MIN);

    const pay = async () => {
        if (!valid) return toast.error(`Pick an amount between ${formatMoney(TIP_MIN)} and ${formatMoney(TIP_MAX)}.`);
        setPending(true);
        const { error, url } = await createTipCheckout({ toUserId: userId, amount: chosen, message });
        if (error || !url) {
            setPending(false);
            return toast.error(error ?? "Couldn't start the payment.");
        }
        window.location.href = url; // Stripe's secure payment page
    };

    return (
        <>
            <button
                type="button"
                onClick={() => (signedIn ? setOpen(true) : navigate("/auth/signin"))}
                className="flex items-center gap-2 rounded-sm bg-amber-400 px-3 py-1 text-sm font-medium text-black transition hover:bg-amber-300 cursor-pointer"
            >
                <Coffee className="h-4 w-4" /> Buy me a coffee
            </button>

            {open && (
                <StepModal
                    title={`Buy ${name} a coffee`}
                    subtitle="A small thank-you for their work"
                    onClose={() => setOpen(false)}
                    onSubmit={pay}
                    submitLabel={valid ? `Pay ${formatMoney(b.total)}` : "Pay"}
                    pendingLabel="Opening checkout"
                    pending={pending}
                    disabled={!valid}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">How much?</p>
                        <div className="grid grid-cols-4 gap-2">
                            {TIP_PRESETS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => {
                                        setAmount(p);
                                        setCustom("");
                                    }}
                                    className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm font-semibold ring-1 cursor-pointer ${
                                        !custom && amount === p ? "bg-black text-white ring-black" : "bg-white ring-black/10 hover:ring-black/30"
                                    }`}
                                >
                                    <span className="flex">
                                        {Array.from({ length: p / 100 >= 10 ? 3 : p / 100 >= 5 ? 2 : 1 }).map((_, i) => (
                                            <Coffee key={i} className="size-3.5" />
                                        ))}
                                    </span>
                                    {formatMoney(p)}
                                </button>
                            ))}
                            <label
                                className={`flex items-center rounded-lg px-2 text-sm ring-1 ${
                                    custom ? "bg-white ring-black" : "bg-white ring-black/10"
                                }`}
                            >
                                <span className="text-gray-500">$</span>
                                <input
                                    inputMode="decimal"
                                    value={custom}
                                    onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, "").slice(0, 6))}
                                    placeholder="Other"
                                    aria-label="Custom amount"
                                    className="w-full min-w-0 bg-transparent px-1 py-2 outline-none"
                                />
                            </label>
                        </div>
                        {custom && !valid && (
                            <p className="text-xs text-red-600">
                                Between {formatMoney(TIP_MIN)} and {formatMoney(TIP_MAX)}.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="coffee-msg" className="text-sm font-semibold">
                            Message <span className="font-normal text-gray-500">(optional)</span>
                        </label>
                        <textarea
                            id="coffee-msg"
                            value={message}
                            maxLength={200}
                            rows={2}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Say something nice to ${name}`}
                            className="w-full resize-none rounded-md bg-white p-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <MoneySplit b={b} recipient={name} />

                    <p className="text-xs text-gray-500">
                        You&apos;ll pay on Stripe&apos;s secure page. Inkference never sees your card details.
                    </p>
                </StepModal>
            )}
        </>
    );
}
