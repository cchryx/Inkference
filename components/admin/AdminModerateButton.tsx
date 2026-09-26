"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useIsAdmin } from "./useIsAdmin";
import ModerateModal, { type ModTarget } from "./ModerateModal";

type Props = {
    targetType: ModTarget;
    targetId: string;
    photos?: string[];
    onDeleted?: () => void;
    className?: string;
    /** Show the word "Moderate" next to the shield. */
    withLabel?: boolean;
};

/** A small shield button, only shown to admins. Opens the moderate popup. */
export default function AdminModerateButton({ targetType, targetId, photos, onDeleted, className = "", withLabel }: Props) {
    const isAdmin = useIsAdmin();
    const [open, setOpen] = useState(false);
    if (!isAdmin) return null;

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
                title="Moderate (admin)"
                aria-label="Moderate (admin)"
                className={`flex items-center gap-1 rounded-md p-1.5 text-red-600 hover:bg-red-50 cursor-pointer ${className}`}
            >
                <ShieldAlert className="size-4" />
                {withLabel && <span className="text-xs font-medium">Moderate</span>}
            </button>
            {open && (
                <ModerateModal
                    targetType={targetType}
                    targetId={targetId}
                    photos={photos}
                    onClose={() => setOpen(false)}
                    onDeleted={onDeleted}
                />
            )}
        </>
    );
}
