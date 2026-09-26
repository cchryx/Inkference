"use client";

import { toast } from "sonner";
import { STORAGE_FULL_MESSAGE, SUPPORT_USERNAME } from "@/lib/storageConfig";
import { checkStorageRoom } from "@/actions/storage";

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

/**
 * Before starting a background upload: if there's no room, say so now
 * (instead of failing later) and return false.
 */
export async function ensureRoom(incomingBytes = 0) {
    try {
        const { ok } = await checkStorageRoom(incomingBytes);
        if (!ok) showStorageFull();
        return ok;
    } catch {
        return true; // couldn't check: let the upload try (the server checks too)
    }
}

/** An expected failure (like being out of space): shown to the person, not logged as a crash. */
export class QuietError extends Error {
    quiet = true;
}
