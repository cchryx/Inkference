"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import ConfirmModal from "@/components/general/ConfirmModal";
import { removeResume, uploadResume } from "@/actions/profile/resume";
import { MB, RESUME_MAX_MB } from "@/lib/storageConfig";
import { showStorageFull } from "@/lib/storageToast";

type Props = { url: string | null; name: string | null; isLoading?: boolean };

/** Settings > Profile: add, replace or remove the resume shown on your profile. */
export default function ResumeForm({ url, name, isLoading }: Props) {
    const router = useRouter();
    const input = useRef<HTMLInputElement>(null);
    const [current, setCurrent] = useState<{ url: string | null; name: string | null }>({ url, name });
    const [lastProp, setLastProp] = useState(url);
    const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
    const [confirm, setConfirm] = useState(false);

    // The saved resume arrived: show it.
    if (url !== lastProp) {
        setLastProp(url);
        setCurrent({ url, name });
    }

    const pick = async (file?: File) => {
        if (!file) return;
        if (!(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) return toast.error("Resumes must be a PDF.");
        if (file.size > RESUME_MAX_MB * MB) return toast.error(`That PDF is over ${RESUME_MAX_MB} MB.`);
        setBusy("upload");
        const form = new FormData();
        form.set("file", file);
        const res = await uploadResume(form);
        setBusy(null);
        if (res.error) return "code" in res && res.code === "storage_full" ? showStorageFull(res.error) : toast.error(res.error);
        setCurrent({ url: res.url ?? null, name: res.name ?? null });
        toast.success("Resume saved. It's on your profile now.");
        router.refresh();
    };

    const remove = async () => {
        setBusy("remove");
        const res = await removeResume();
        setBusy(null);
        setConfirm(false);
        if (res.error) return toast.error(res.error);
        setCurrent({ url: null, name: null });
        toast.success("Resume removed.");
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
            <div>
                <h1 className="text-base font-semibold">Resume</h1>
                <p className="text-xs text-muted-foreground">
                    A PDF up to {RESUME_MAX_MB} MB. People can open it from your profile. It counts toward your storage.
                </p>
            </div>

            <input
                ref={input}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = "";
                }}
            />

            {current.url ? (
                <div className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-black/5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
                        <FileText className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{current.name || "Resume.pdf"}</span>
                        <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline">
                            Open <ExternalLink className="size-3" />
                        </a>
                    </span>
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={!!busy} onClick={() => input.current?.click()}>
                        {busy === "upload" ? <Loader size={4} color="text-gray-700" /> : <Upload className="size-3.5" />} Replace
                    </Button>
                    <button
                        type="button"
                        onClick={() => setConfirm(true)}
                        disabled={!!busy}
                        aria-label="Remove resume"
                        className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => input.current?.click()}
                    disabled={!!busy}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        void pick(e.dataTransfer.files?.[0]);
                    }}
                    className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                    {busy === "upload" ? <Loader size={5} color="text-gray-700" /> : <Upload className="size-5" />}
                    {busy === "upload" ? "Uploading..." : "Upload or drag a PDF"}
                </button>
            )}

            <ConfirmModal
                isPending={busy === "remove"}
                open={confirm}
                title="Remove your resume?"
                text="It disappears from your profile and is deleted from storage."
                confirmText="Remove"
                onConfirm={remove}
                onClose={() => setConfirm(false)}
            />
        </div>
    );
}
