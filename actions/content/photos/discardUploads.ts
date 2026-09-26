"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { deleteUnusedUploads } from "@/lib/cleanupUploads";

/**
 * Deletes photos someone uploaded and then didn't keep (closed a popup,
 * swapped a picture, changed their profile photo). Only your own uploads,
 * and never anything that's actually used somewhere.
 */
export async function discardUploads(urls: string[]) {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId || !Array.isArray(urls)) return { deleted: 0 };

    const deleted = await deleteUnusedUploads(urls.slice(0, 20), userId);
    return { deleted };
}
