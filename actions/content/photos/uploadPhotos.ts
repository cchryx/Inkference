"use server";

import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type UploadResult = {
    fileName: string;
    url?: string;
    error?: string;
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_FILES = 20;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per photo
const FOLDERS = ["photos", "posts", "projects", "merits", "profile"];

/**
 * Uploads photos into the signed-in user's own Cloudinary folder.
 * `_currentUserId` is ignored (kept so old callers still work): the user
 * always comes from the login session, so nobody can upload as someone else.
 */
export async function uploadPhotos(
    files: File[],
    _currentUserId?: string,
    folder?: string
): Promise<UploadResult[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) {
        return files.map((f) => ({ fileName: f?.name ?? "", error: "Unauthorized." }));
    }

    if (!Array.isArray(files) || files.length > MAX_FILES) {
        return [{ fileName: "", error: `Upload at most ${MAX_FILES} photos at a time.` }];
    }

    const safeFolder = folder && FOLDERS.includes(folder) ? folder : "photos";
    const results: UploadResult[] = [];

    for (const file of files) {
        const looksLikeImage =
            file instanceof File &&
            (file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(file.name));
        if (!looksLikeImage) {
            results.push({ fileName: file?.name ?? "", error: "Only images can be uploaded." });
            continue;
        }
        if (file.size > MAX_BYTES) {
            results.push({ fileName: file.name, error: "Photo is too big." });
            continue;
        }

        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: `${userId}/${safeFolder}`, resource_type: "image" },
                    (error, result) => {
                        if (error || !result) reject(error ?? new Error("Upload failed"));
                        else resolve(result);
                    }
                );
                stream.on("error", reject);
                stream.end(buffer);
            });

            results.push({ fileName: file.name, url: uploaded.secure_url });
        } catch (err) {
            console.error("uploadPhotos failed:", err);
            results.push({ fileName: file.name, error: "Upload failed." });
        }
    }

    return results;
}
