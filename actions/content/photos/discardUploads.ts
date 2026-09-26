"use server";

import { deleteUnusedUploads } from "@/lib/cleanupUploads";
import { getSession } from "@/lib/session";

/**
 * Deletes photos someone uploaded and then didn't keep (closed a popup,
 * swapped a picture, changed their profile photo). Only your own uploads,
 * and never anything that's actually used somewhere.
 */
export async function discardUploads(urls: string[]) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId || !Array.isArray(urls)) return { deleted: 0 };

    const deleted = await deleteUnusedUploads(urls.slice(0, 20), userId);
    return { deleted };
}
