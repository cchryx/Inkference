import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { isOwnUpload, publicIdFromUrl } from "@/lib/uploads";
import { forgetUploads } from "@/lib/storage";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Server only. Deletes photos from storage once nothing uses them anymore
 * (an old profile picture, a swapped project banner, a deleted merit...).
 * Only touches this user's own uploads, and skips anything still in use.
 */
export async function deleteUnusedUploads(urls: (string | null | undefined)[], userId: string) {
    const list = [...new Set(urls.filter((u): u is string => !!u))].slice(0, 100);
    const gone: string[] = [];

    for (const url of list) {
        if (!isOwnUpload(url, userId)) continue;
        const publicId = publicIdFromUrl(url);
        if (!publicId) continue;

        // Still used somewhere? Then keep it.
        const uses = await Promise.all([
            prisma.project.count({ where: { OR: [{ iconImage: url }, { bannerImage: url }] } }),
            prisma.projectGalleryImage.count({ where: { image: url } }),
            prisma.merit.count({ where: { image: url } }),
            prisma.photo.count({ where: { image: url } }),
            prisma.post.count({ where: { content: { has: url } } }),
            prisma.user.count({ where: { image: url } }),
            prisma.profile.count({ where: { bannerImage: url } }),
            prisma.skill.count({ where: { iconImage: url } }),
        ]);
        if (uses.some((n) => n > 0)) continue;

        try {
            await cloudinary.uploader.destroy(publicId);
            gone.push(url);
        } catch (err) {
            console.error("deleteUnusedUploads failed:", url, err);
        }
    }

    await forgetUploads(gone).catch(() => {});
    return gone.length;
}
