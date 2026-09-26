"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/general/ConfirmModal";
import Loader from "@/components/general/Loader";
import { UploadSessionProvider, useUploadSession } from "@/components/general/photo-editor/uploadSession";

type Props = {
    /** What this modal does, e.g. "Add experience". */
    title: string;
    /** Step names. Leave out for a one-page modal. */
    steps?: string[];
    step?: number;
    /** Small grey line under the title (one-page modals). */
    subtitle?: string;
    children: ReactNode;

    onClose: () => void;
    /** Ask "Discard?" before closing when something was filled in. */
    dirty?: boolean;
    discardTitle?: string;
    discardText?: string;

    onBack?: () => void;
    onNext?: () => void;
    onSubmit: () => void;
    submitLabel: string;
    nextLabel?: string;
    /** Shown on the main button while saving (e.g. "Uploading 3/10"). */
    pendingLabel?: string;
    pending?: boolean;
    /** Main button greyed out (not ready yet). */
    disabled?: boolean;
    /** Wider body for photo editors. Default is a comfortable form width. */
    size?: "md" | "lg";
};

/**
 * The shared look for every "create" and "add" popup: title and step on
 * top, the form in the middle, Back / progress / Next along the bottom.
 */
export default function StepModal({
    title,
    steps,
    step = 0,
    subtitle,
    children,
    onClose,
    dirty = false,
    discardTitle = "Discard changes?",
    discardText = "What you've filled in will be lost.",
    onBack,
    onNext,
    onSubmit,
    submitLabel,
    nextLabel = "Next",
    pendingLabel,
    pending = false,
    disabled = false,
    size = "md",
}: Props) {
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const count = steps?.length ?? 1;
    const isLast = step >= count - 1;
    // Pictures uploaded inside this popup (e.g. a project banner).
    const uploads = useUploadSession();

    // Closing without saving: also delete anything uploaded in here.
    const closeWithoutSaving = () => {
        uploads.discardAll();
        onClose();
    };

    const requestClose = () => {
        if (pending) return;
        if (dirty) setConfirmDiscard(true);
        else closeWithoutSaving();
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2"
            onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`bg-gray-100 rounded-xl shadow-lg flex flex-col max-h-[95dvh] w-full ${
                    size === "lg" ? "max-w-[640px]" : "max-w-[560px]"
                } ${
                    // Step-by-step popups keep one tall size: no jumping between
                    // steps, and dropdowns have room to open fully.
                    steps && steps.length > 1 ? "h-[min(640px,92dvh)]" : ""
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-300">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold leading-tight truncate">
                            {steps ? steps[step] : title}
                        </h2>
                        <p className="text-xs text-gray-500 truncate">
                            {steps ? `${title} · Step ${step + 1} of ${count}` : subtitle}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={requestClose}
                        disabled={pending}
                        aria-label="Close"
                        className="p-1 rounded-md text-gray-600 hover:text-black hover:bg-gray-200 cursor-pointer shrink-0"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="scroll-thin flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                    <UploadSessionProvider session={uploads}>{children}</UploadSessionProvider>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-300">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => (step > 0 && onBack ? onBack() : requestClose())}
                        disabled={pending}
                    >
                        {step > 0 && onBack ? "Back" : "Cancel"}
                    </Button>

                    {count > 1 && (
                        <div className="flex gap-1.5 items-center" aria-hidden>
                            {Array.from({ length: count }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === step ? "w-5 bg-black" : i < step ? "w-1.5 bg-gray-700" : "w-1.5 bg-gray-400"
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        onClick={isLast || !onNext ? onSubmit : onNext}
                        disabled={pending || disabled}
                        className="min-w-[96px]"
                    >
                        {pending ? (
                            <span className="flex items-center gap-2">
                                <Loader size={4} />
                                {pendingLabel}
                            </span>
                        ) : isLast || !onNext ? (
                            submitLabel
                        ) : (
                            nextLabel
                        )}
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isPending={false}
                open={confirmDiscard}
                title={discardTitle}
                text={discardText}
                confirmText="Discard"
                cancelText="Keep editing"
                confirmVariant="destructive"
                onConfirm={closeWithoutSaving}
                onClose={() => setConfirmDiscard(false)}
            />
        </div>
    );
}
