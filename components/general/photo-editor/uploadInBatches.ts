import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";

const BATCH = 5;

/**
 * Uploads a few photos at a time (the server takes at most 20 per call),
 * reporting progress as it goes. Returns the URLs that worked, in order.
 */
export async function uploadInBatches(
    files: File[],
    folder: string,
    onProgress?: (done: number, total: number) => void
) {
    const urls: string[] = [];
    let failed = 0;
    onProgress?.(0, files.length);

    for (let i = 0; i < files.length; i += BATCH) {
        const results = await uploadPhotos(files.slice(i, i + BATCH), undefined, folder);
        for (const r of results) {
            if (r.url) urls.push(r.url);
            else failed++;
        }
        onProgress?.(Math.min(i + BATCH, files.length), files.length);
    }

    return { urls, failed };
}
