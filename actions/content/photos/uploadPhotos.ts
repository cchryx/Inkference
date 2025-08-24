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

export async function uploadPhotos(
    files: File[],
    currentUserId: string
): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult: any = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: `${currentUserId}/photos` },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.on("error", reject);
                stream.end(buffer);
            });

            results.push({
                fileName: file.name,
                url: uploadResult.secure_url,
            });
        } catch (err: any) {
            results.push({
                fileName: file.name,
                error: err.message,
            });
        }
    }

    return results;
}
