"use server";

import { v2 as cloudinary } from "cloudinary";

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

// Optional: upload to Vercel Blob (for backup)
async function uploadToBlob(file: File): Promise<void> {
    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;
    const uploadUrl = `https://blob.vercel-storage.com/uploads/${file.name}`;

    const arrayBuffer = await file.arrayBuffer();

    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${BLOB_TOKEN}`,
            "Content-Type": file.type,
        },
        body: arrayBuffer,
    });

    if (!res.ok)
        throw new Error(
            `Failed to upload file to Vercel Blob: ${res.statusText}`
        );
}

export async function uploadPhotos(
    files: File[],
    currentUserId: string
): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
        try {
            // 1️⃣ Upload to Vercel Blob (optional backup)
            await uploadToBlob(file);

            // 2️⃣ Upload directly from buffer to Cloudinary
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const cloudResult: any = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: `${currentUserId}/photos` },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(buffer);
            });

            results.push({
                fileName: file.name,
                url: cloudResult.secure_url,
            });
        } catch (err: any) {
            console.log(err);
            results.push({
                fileName: file.name,
                error: err.message,
            });
        }
    }

    return results;
}
