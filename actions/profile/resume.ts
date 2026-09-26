"use server";

import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forgetUploads, recordUpload, wouldExceed } from "@/lib/storage";
import { MB, RESUME_MAX_MB, STORAGE_FULL_MESSAGE } from "@/lib/storageConfig";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// PDFs are stored as "raw" files (so they download/open as normal PDFs)
// in the person's own folder: <userId>/resume/resume_<time>.pdf

/** ".../raw/upload/v123/<id>/resume/resume_1.pdf" -> "<id>/resume/resume_1.pdf" */
function rawPublicId(url: string) {
    const after = url.split("/raw/upload/")[1];
    return after ? after.replace(/^v\d+\//, "") : null;
}

async function deleteOld(url: string | null | undefined, userId: string) {
    if (!url) return;
    const publicId = rawPublicId(url);
    if (!publicId || !publicId.startsWith(`${userId}/`)) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch (err) {
        console.error("delete old resume failed:", err);
    }
    await forgetUploads([url]).catch(() => {});
}

/** Upload (or replace) your resume. PDF only, up to 5 MB. */
export async function uploadResume(formData: FormData) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { error: "Sign in first." };

    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Pick a PDF." };
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) return { error: "Resumes must be a PDF." };
    if (file.size > RESUME_MAX_MB * MB) return { error: `That PDF is over ${RESUME_MAX_MB} MB.` };

    const old = await prisma.profile.findUnique({ where: { userId }, select: { resumeUrl: true } });
    // The old one is replaced, so it doesn't count against the new one.
    const oldBytes = old?.resumeUrl
        ? ((await prisma.storedFile.findUnique({ where: { url: old.resumeUrl }, select: { bytes: true } }))?.bytes ?? 0)
        : 0;
    if (await wouldExceed(userId, file.size - oldBytes)) return { error: STORAGE_FULL_MESSAGE, code: "storage_full" as const };

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await new Promise<{ secure_url: string; public_id: string; bytes: number }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `${userId}/resume`,
                    public_id: `resume_${Date.now()}.pdf`,
                    resource_type: "raw",
                },
                (error, result) => (error || !result ? reject(error ?? new Error("Upload failed")) : resolve(result))
            );
            stream.on("error", reject);
            stream.end(buffer);
        });

        await recordUpload({ userId, url: uploaded.secure_url, publicId: uploaded.public_id, bytes: uploaded.bytes ?? file.size, kind: "resume" });

        const name = file.name.replace(/[^\w.\- ()]/g, "").slice(0, 120) || "Resume.pdf";
        await prisma.profile.upsert({
            where: { userId },
            update: { resumeUrl: uploaded.secure_url, resumeName: name, resumeUpdatedAt: new Date() },
            create: { userId, resumeUrl: uploaded.secure_url, resumeName: name, resumeUpdatedAt: new Date() },
        });
        await deleteOld(old?.resumeUrl, userId);
        revalidatePath("/profile/[username]", "page");
        return { error: null, url: uploaded.secure_url, name };
    } catch (err) {
        console.error("uploadResume failed:", err);
        return { error: "Upload failed. Try again." };
    }
}

export async function removeResume() {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { error: "Sign in first." };
    const old = await prisma.profile.findUnique({ where: { userId }, select: { resumeUrl: true } });
    await prisma.profile.updateMany({ where: { userId }, data: { resumeUrl: null, resumeName: null, resumeUpdatedAt: new Date() } });
    await deleteOld(old?.resumeUrl, userId);
    revalidatePath("/profile/[username]", "page");
    return { error: null };
}
