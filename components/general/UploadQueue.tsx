"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, CloudUpload, RotateCcw, TriangleAlert, X } from "lucide-react";
import Loader from "@/components/general/Loader";
import { dismiss, hasActiveUploads, retryUpload, useUploadQueue } from "@/lib/uploadQueue";

/** Small panel in the corner showing uploads running in the background. */
export default function UploadQueue() {
    const jobs = useUploadQueue();
    const [collapsed, setCollapsed] = useState(false);

    // Warn before closing the tab while something is still uploading.
    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (hasActiveUploads()) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, []);

    if (!jobs.length) return null;

    const active = jobs.filter((j) => j.status === "waiting" || j.status === "running").length;
    const failed = jobs.filter((j) => j.status === "failed").length;

    return (
        <div className="fixed bottom-24 right-3 z-40 w-[min(92vw,320px)] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/10 md:bottom-4 md:right-4">
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold cursor-pointer"
            >
                {active ? (
                    <Loader size={4} color="text-gray-700" />
                ) : failed ? (
                    <TriangleAlert className="size-4 text-red-600" />
                ) : (
                    <CheckCircle2 className="size-4 text-green-600" />
                )}
                <span className="flex-1">
                    {active ? `Uploading ${active}...` : failed ? `${failed} upload${failed > 1 ? "s" : ""} failed` : "All done"}
                </span>
                <ChevronDown className={`size-4 text-gray-500 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>

            {!collapsed && (
                <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100">
                    {jobs.map((j) => (
                        <li key={j.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <span className="shrink-0">
                                {j.status === "running" ? (
                                    <CloudUpload className="size-4 text-sky-600" />
                                ) : j.status === "done" ? (
                                    <CheckCircle2 className="size-4 text-green-600" />
                                ) : j.status === "failed" ? (
                                    <TriangleAlert className="size-4 text-red-600" />
                                ) : (
                                    <CloudUpload className="size-4 text-gray-400" />
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{j.label}</span>
                                <span className={`block truncate text-xs ${j.status === "failed" ? "text-red-600" : "text-gray-500"}`}>
                                    {j.status === "waiting"
                                        ? "Waiting..."
                                        : j.status === "running"
                                          ? (j.progress ?? "Working...")
                                          : j.status === "done"
                                            ? "Done"
                                            : (j.error ?? "Failed")}
                                </span>
                            </span>
                            {j.status === "failed" && (
                                <button
                                    type="button"
                                    onClick={() => retryUpload(j.id)}
                                    aria-label="Try again"
                                    title="Try again"
                                    className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer"
                                >
                                    <RotateCcw className="size-4" />
                                </button>
                            )}
                            {j.status !== "running" && (
                                <button
                                    type="button"
                                    onClick={() => dismiss(j.id)}
                                    aria-label="Dismiss"
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
