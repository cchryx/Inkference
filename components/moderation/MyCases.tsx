"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { appealCase, getMyCases, type MyCase } from "@/actions/moderation";
import { previewUrl } from "@/lib/imageUrl";

const STATUS = {
    flagged: { label: "Hidden, waiting for you", icon: Clock, className: "bg-red-100 text-red-700" },
    appealed: { label: "Appeal sent, an admin will look", icon: Clock, className: "bg-amber-100 text-amber-800" },
    removed: { label: "Removed", icon: Trash2, className: "bg-gray-200 text-gray-700" },
    restored: { label: "Back up", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
} as const;

/** Your flagged or removed things, and a way to appeal. */
export default function MyCases() {
    const { data, isLoading } = useQuery({ queryKey: ["myCases"], queryFn: () => getMyCases() });

    return (
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 pb-24">
            <header className="flex items-center gap-3">
                <div className="rounded-xl bg-red-600 p-2.5 text-white">
                    <ShieldAlert className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold leading-tight">Account review</h1>
                    <p className="text-sm text-gray-500">Things an admin flagged or removed, and why.</p>
                </div>
            </header>

            <p className="rounded-lg bg-gray-100 p-3 text-xs text-gray-600">
                Flagged things are hidden and deleted after 3 days. If you think it&apos;s a mistake, appeal before then and
                it stays until an admin decides.
            </p>

            {isLoading ? (
                <Skeleton className="h-28 w-full rounded-xl" />
            ) : !data?.length ? (
                <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
                    Nothing here. You&apos;re all good.
                </p>
            ) : (
                <ul className="space-y-3">
                    {data.map((c) => (
                        <CaseCard key={c.id} c={c} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function CaseCard({ c }: { c: MyCase }) {
    const queryClient = useQueryClient();
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const s = STATUS[c.status as keyof typeof STATUS] ?? STATUS.removed;

    const send = async () => {
        setBusy(true);
        const res = await appealCase(c.id, text);
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success("Appeal sent. It won't be deleted while an admin reviews it.");
        queryClient.invalidateQueries({ queryKey: ["myCases"] });
    };

    return (
        <li className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex gap-3">
                {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl(c.image, 200)} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${s.className}`}>
                        <s.icon className="size-3" /> {s.label}
                    </span>
                    <p className="truncate text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        {c.status === "flagged" && c.deleteAt && (
                            <>
                                {" "}
                                · deleted <span className="font-semibold text-red-600">{formatDistanceToNow(new Date(c.deleteAt), { addSuffix: true })}</span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <p className="rounded-md bg-gray-50 p-2.5 text-sm">
                <span className="font-semibold">Reason: </span>
                {c.reason}
            </p>

            {c.appeal && (
                <p className="rounded-md bg-amber-50 p-2.5 text-sm">
                    <span className="font-semibold">Your appeal: </span>
                    {c.appeal}
                </p>
            )}

            {c.status === "flagged" && (
                <div className="space-y-2">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder="Why should it stay up?"
                        className="w-full resize-none rounded-lg p-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={send} disabled={busy || text.trim().length < 5} className="cursor-pointer">
                            {busy && <Loader size={4} color="text-white" />} Send appeal
                        </Button>
                    </div>
                </div>
            )}
        </li>
    );
}
