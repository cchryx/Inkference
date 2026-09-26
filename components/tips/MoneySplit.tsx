import { PLATFORM_FEE_PERCENT, formatMoney, type TipBreakdown } from "@/lib/payments/fees";

/** "Where your money goes": a clear split of one coffee. */
export default function MoneySplit({ b, recipient }: { b: TipBreakdown; recipient: string }) {
    const rows = [
        { label: `To ${recipient}`, hint: `${100 - PLATFORM_FEE_PERCENT}% of the coffee`, value: b.toRecipient, color: "bg-amber-500" },
        { label: "To Inkference", hint: `${PLATFORM_FEE_PERCENT}% to keep the app running`, value: b.platformFee, color: "bg-neutral-900" },
        { label: "Card processing", hint: "Kept by Stripe, the payment company", value: b.processingFee, color: "bg-gray-400" },
    ];
    return (
        <div className="space-y-3 rounded-lg bg-white p-3 ring-1 ring-black/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Where your money goes</p>
            {/* One bar split by share */}
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                {rows.map((r) => (
                    <span key={r.label} className={r.color} style={{ width: `${(r.value / b.total) * 100}%` }} />
                ))}
            </div>
            <ul className="space-y-1.5 text-sm">
                {rows.map((r) => (
                    <li key={r.label} className="flex items-center gap-2">
                        <span className={`size-2.5 shrink-0 rounded-full ${r.color}`} />
                        <span className="min-w-0 flex-1">
                            <span className="font-medium">{r.label}</span>{" "}
                            <span className="text-xs text-gray-500">· {r.hint}</span>
                        </span>
                        <span className="tabular-nums">{formatMoney(r.value)}</span>
                    </li>
                ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span>You pay</span>
                <span className="tabular-nums">{formatMoney(b.total)}</span>
            </div>
        </div>
    );
}
