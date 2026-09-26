"use client";

import { toast } from "sonner";
import { STORAGE_FULL_MESSAGE, SUPPORT_USERNAME } from "@/lib/storageConfig";

/** Tells someone they're out of photo space, and why. */
export function showStorageFull(message: string = STORAGE_FULL_MESSAGE) {
    toast.error("Out of photo storage", {
        description: message,
        duration: 12000,
        action: {
            label: "Buy a coffee",
            onClick: () => {
                window.location.href = `/profile/${SUPPORT_USERNAME}`;
            },
        },
    });
}
