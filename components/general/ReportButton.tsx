"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/general/Modal";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { reportContent } from "@/actions/reports";
import { REPORT_REASONS, type ReportTarget } from "@/lib/reportReasons";

const WORDS: Record<ReportTarget, string> = { post: "post", project: "project", gallery: "gallery", photo: "photo" };

type Props = {
    targetType: ReportTarget;
    targetId: string;
    className?: string;
    withLabel?: boolean;
    /** Render only the popup, opened from somewhere else (e.g. the photo viewer). */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

/** "Report" button + popup. Hidden when signed out. Goes to the admins. */
export default function ReportButton({ targetType, targetId, className = "", withLabel, open: controlled, onOpenChange }: Props) {
    const { data: session } = useSession();
    const [ownOpen, setOwnOpen] = useState(false);
    const open = controlled ?? ownOpen;
    const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOwnOpen(v));
    const [reason, setReason] = useState<string>("");
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);

    if (!session) return null;

    const send = async () => {
        if (!reason) return toast.error("Pick a reason.");
        setBusy(true);
        const res = await reportContent({ targetType, targetId, reason, details });
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success("Thanks. An admin will take a look.");
        setOpen(false);
        setReason("");
        setDetails("");
    };

    return (
        <>
            {controlled === undefined && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    title={`Report this ${WORDS[targetType]}`}
                    aria-label={`Report this ${WORDS[targetType]}`}
                    className={`flex items-center gap-1 rounded-md p-1.5 text-gray-600 hover:bg-gray-300 hover:text-black cursor-pointer ${className}`}
                >
                    <Flag className="size-4" />
                    {withLabel && <span className="text-sm">Report</span>}
                </button>
            )}

            {open && (
                <Modal open onClose={busy ? () => {} : () => setOpen(false)}>
                    <div className="w-[min(92vw,420px)] space-y-4 rounded-xl bg-white p-5 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <Flag className="size-4" /> Report this {WORDS[targetType]}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="rounded p-1 hover:bg-gray-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {REPORT_REASONS.map((r) => (
                                <label
                                    key={r.id}
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm ring-1 transition ${
                                        reason === r.id ? "bg-gray-50 ring-black/40" : "ring-black/10 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="report-reason"
                                        checked={reason === r.id}
                                        onChange={() => setReason(r.id)}
                                        className="accent-black"
                                    />
                                    {r.label}
                                </label>
                            ))}
                        </div>

                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            maxLength={500}
                            rows={2}
                            placeholder="Anything else? (optional)"
                            className="w-full resize-none rounded-lg p-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                        />
                        <p className="text-xs text-gray-500">Only admins see reports. The owner isn&apos;t told who reported it.</p>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={busy} className="cursor-pointer">
                                Cancel
                            </Button>
                            <Button size="sm" onClick={send} disabled={busy || !reason} className="cursor-pointer">
                                {busy && <Loader size={4} color="text-white" />} Send report
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
