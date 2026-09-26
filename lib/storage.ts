import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { STORAGE_LIMIT_BYTES } from "@/lib/storageConfig";

// Server-side bookkeeping of how much each person has stored.

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function getUsageBytes(userId: string) {
    const agg = await prisma.storedFile.aggregate({ where: { userId }, _sum: { bytes: true } });
    return agg._sum.bytes ?? 0;
}

/** Would adding `incoming` bytes go over this person's limit? */
export async function wouldExceed(userId: string, incoming: number) {
    return (await getUsageBytes(userId)) + incoming > STORAGE_LIMIT_BYTES;
}

export async function recordUpload(input: { userId: string; url: string; publicId: string; bytes: number; kind: string }) {
    await prisma.storedFile.upsert({
        where: { url: input.url },
        update: { bytes: input.bytes },
        create: input,
    });
}

/** Files were deleted from storage: stop counting them. */
export async function forgetUploads(urls: (string | null | undefined)[]) {
    const list = urls.filter((u): u is string => !!u);
    if (list.length) await prisma.storedFile.deleteMany({ where: { url: { in: list } } });
}

type CloudinaryResource = { public_id: string; secure_url: string; bytes: number; created_at?: string };

/**
 * Recounts everything in this person's Cloudinary folder, so uploads made
 * before we started counting are included too.
 */
export async function syncFromCloudinary(userId: string) {
    const found: CloudinaryResource[] = [];
    let cursor: string | undefined;
    do {
        const res = await cloudinary.api.resources({
            type: "upload",
            resource_type: "image",
            prefix: `${userId}/`,
            max_results: 500,
            next_cursor: cursor,
        });
        found.push(...(res.resources as CloudinaryResource[]));
        cursor = res.next_cursor;
    } while (cursor && found.length < 10000);

    await prisma.$transaction([
        prisma.storedFile.deleteMany({ where: { userId } }),
        prisma.storedFile.createMany({
            data: found.map((r) => ({
                userId,
                url: r.secure_url,
                publicId: r.public_id,
                bytes: r.bytes ?? 0,
                kind: r.public_id.split("/")[1] ?? "photos",
                ...(r.created_at ? { createdAt: new Date(r.created_at) } : {}),
            })),
            skipDuplicates: true,
        }),
    ]);
    return found.length;
}
