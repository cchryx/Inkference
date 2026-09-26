"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/** Simple popup used by the planner (closes on Esc or clicking outside). */
export default function BoardDialog({
    title,
    onClose,
    children,
    width = "max-w-[600px]",
}: {
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
    width?: string;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:p-6"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div role="dialog" aria-modal="true" className={`my-auto w-full ${width} rounded-xl bg-gray-100 shadow-lg`}>
                <div className="flex items-start justify-between gap-3 px-5 pt-4">
                    <div className="min-w-0 flex-1">{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-gray-600 hover:bg-gray-200 hover:text-black cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                <div className="px-5 pb-5 pt-3">{children}</div>
            </div>
        </div>
    );
}
