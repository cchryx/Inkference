"use client";

import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";
import { discardUploads } from "@/actions/content/photos/discardUploads";
import { showStorageFull } from "@/lib/storageToast";

/*
 * Pictures picked in a form wait here, on the device, until you press save.
 * Only then are they uploaded. So nothing lands in storage for a form you
 * never finished.
 *
 * A waiting picture is shown with a temporary "blob:" link.
 */

type Entry = { file: File; folder: string; uploaded?: string };
const staged = new Map<string, Entry>();

/** Keep a picture on the device for now. Returns a link to preview it. */
export function stage(file: File, folder: string) {
    const url = URL.createObjectURL(file);
    staged.set(url, { file, folder });
    return url;
}

export const isStaged = (url: string | null | undefined) => !!url && staged.has(url);

/** Not needed anymore: forget it (and delete it if a failed save already uploaded it). */
export function unstage(url: string | null | undefined) {
    if (!url) return;
    const entry = staged.get(url);
    if (!entry) return;
    staged.delete(url);
    URL.revokeObjectURL(url);
    if (entry.uploaded) void discardUploads([entry.uploaded]);
}

/** Saved: let go of the previews but keep the uploads. */
export function release(urls: (string | null | undefined)[]) {
    for (const url of urls) {
        if (!url || !staged.has(url)) continue;
        staged.delete(url);
        URL.revokeObjectURL(url);
    }
}

/**
 * Uploads any waiting pictures in `urls` and gives back the real links
 * (links that were already real are passed through). Run this on save.
 */
export async function commitStaged(
    urls: string[]
): Promise<{ urls: string[]; error?: undefined } | { urls?: undefined; error: string }> {
    const out: string[] = [];
    for (const url of urls) {
        const entry = url ? staged.get(url) : undefined;
        if (!entry) {
            out.push(url);
            continue;
        }
        if (!entry.uploaded) {
            const [result] = await uploadPhotos([entry.file], undefined, entry.folder);
            if (!result?.url) {
                if (result?.code === "storage_full") showStorageFull(result.error);
                return { error: result?.code === "storage_full" ? "Out of photo storage." : result?.error ?? "Upload failed." };
            }
            entry.uploaded = result.url;
        }
        out.push(entry.uploaded);
    }
    return { urls: out };
}
