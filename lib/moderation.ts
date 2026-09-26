import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { deleteUnusedUploads } from "@/lib/cleanupUploads";
import { forgetUploads } from "@/lib/storage";

// Admin moderation, server only. Nothing here checks who is asking: the
// admin actions do that before calling in.

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/** Things that can be flagged (hidden for review) as well as deleted. */
export const FLAGGABLE = ["post", "project", "gallery", "photo"] as const;
export type Flaggable = (typeof FLAGGABLE)[number];

export type TargetType = Flaggable | "post_photo" | "comment" | "profile_image" | "banner" | "bio" | "resume";

export const REVIEW_DAYS = 3;

const WORDS: Record<TargetType, string> = {
    post: "post",
    project: "project",
    gallery: "gallery",
    photo: "photo",
    post_photo: "photo in your post",
    comment: "comment",
    profile_image: "profile picture",
    banner: "banner",
    bio: "bio",
    resume: "resume",
};
export const targetWords = (t: string) => WORDS[t as TargetType] ?? "content";

const cut = (s: string | null | undefined, n = 80) => (s ? (s.length > n ? `${s.slice(0, n - 1)}…` : s) : "");

/** Who owns it, and a short description + picture for the records. */
export async function describeTarget(type: TargetType, id: string, url?: string) {
    switch (type) {
        case "post":
        case "post_photo": {
            const p = await prisma.post.findUnique({
                where: { id },
                select: { description: true, content: true, userData: { select: { userId: true } } },
            });
            if (!p) return null;
            return {
                ownerId: p.userData.userId,
                label: type === "post" ? `Post${p.description ? `: ${cut(p.description)}` : ""}` : "Photo in a post",
                image: type === "post_photo" ? (url ?? null) : (p.content[0] ?? null),
            };
        }
        case "project": {
            const p = await prisma.project.findUnique({
                where: { id },
                select: { name: true, iconImage: true, bannerImage: true, userData: { select: { userId: true } } },
            });
            if (!p) return null;
            return { ownerId: p.userData.userId, label: `Project: ${cut(p.name)}`, image: p.iconImage ?? p.bannerImage };
        }
        case "gallery": {
            const g = await prisma.gallery.findUnique({
                where: { id },
                select: { name: true, photos: { take: 1, select: { image: true } }, userData: { select: { userId: true } } },
            });
            if (!g) return null;
            return { ownerId: g.userData.userId, label: `Gallery: ${cut(g.name)}`, image: g.photos[0]?.image ?? null };
        }
        case "photo": {
            const p = await prisma.photo.findUnique({
                where: { id },
                select: { image: true, gallery: { select: { name: true, userData: { select: { userId: true } } } } },
            });
            if (!p) return null;
            return { ownerId: p.gallery.userData.userId, label: `Photo in ${cut(p.gallery.name, 60)}`, image: p.image };
        }
        case "comment": {
            const c = await prisma.comment.findUnique({
                where: { id },
                select: { text: true, userData: { select: { userId: true } } },
            });
            if (!c) return null;
            return { ownerId: c.userData.userId, label: `Comment: ${cut(c.text)}`, image: null };
        }
        case "resume": {
            const p = await prisma.profile.findUnique({ where: { userId: id }, select: { resumeUrl: true, resumeName: true } });
            if (!p?.resumeUrl) return null;
            return { ownerId: id, label: `Resume: ${cut(p.resumeName) || "PDF"}`, image: null };
        }
        case "profile_image":
        case "banner":
        case "bio": {
            const u = await prisma.user.findUnique({
                where: { id },
                select: { id: true, image: true, Profile: { select: { bannerImage: true, bio: true } } },
            });
            if (!u) return null;
            return {
                ownerId: u.id,
                label: type === "bio" ? `Bio: ${cut(u.Profile?.bio)}` : type === "banner" ? "Profile banner" : "Profile picture",
                image: type === "profile_image" ? u.image : type === "banner" ? (u.Profile?.bannerImage ?? null) : null,
            };
        }
    }
}

/** Hide (or show again) something while it's under review. */
export async function setHidden(type: Flaggable, id: string, hidden: boolean) {
    const data = { hiddenAt: hidden ? new Date() : null };
    if (type === "post") await prisma.post.updateMany({ where: { id }, data });
    else if (type === "project") await prisma.project.updateMany({ where: { id }, data });
    else if (type === "gallery") await prisma.gallery.updateMany({ where: { id }, data });
    else await prisma.photo.updateMany({ where: { id }, data });
}

/** Deletes it for good, including its pictures in storage. */
export async function removeTarget(type: TargetType, id: string, url?: string | null) {
    const target = await describeTarget(type, id, url ?? undefined);
    if (!target) return; // already gone
    const owner = target.ownerId;
    let files: (string | null | undefined)[] = [];

    switch (type) {
        case "post": {
            const p = await prisma.post.findUnique({ where: { id }, select: { content: true } });
            files = p?.content ?? [];
            await prisma.post.deleteMany({ where: { id } });
            break;
        }
        case "post_photo": {
            const p = await prisma.post.findUnique({ where: { id }, select: { content: true } });
            if (!p || !url) return;
            const rest = p.content.filter((u) => u !== url);
            if (rest.length) await prisma.post.update({ where: { id }, data: { content: rest } });
            else await prisma.post.deleteMany({ where: { id } }); // it was the only photo
            files = [url];
            break;
        }
        case "project": {
            const p = await prisma.project.findUnique({
                where: { id },
                select: { iconImage: true, bannerImage: true, galleryImages: { select: { image: true } } },
            });
            files = [p?.iconImage, p?.bannerImage, ...(p?.galleryImages.map((g) => g.image) ?? [])];
            await prisma.project.deleteMany({ where: { id } });
            break;
        }
        case "gallery": {
            const g = await prisma.gallery.findUnique({ where: { id }, select: { photos: { select: { image: true } } } });
            files = g?.photos.map((p) => p.image) ?? [];
            await prisma.gallery.deleteMany({ where: { id } });
            break;
        }
        case "photo": {
            const p = await prisma.photo.findUnique({ where: { id }, select: { image: true } });
            files = [p?.image];
            await prisma.photo.deleteMany({ where: { id } });
            break;
        }
        case "comment":
            await prisma.comment.deleteMany({ where: { id } });
            break;
        case "profile_image": {
            const u = await prisma.user.findUnique({ where: { id }, select: { image: true } });
            files = [u?.image];
            await prisma.user.update({ where: { id }, data: { image: null } });
            break;
        }
        case "banner": {
            const p = await prisma.profile.findUnique({ where: { userId: id }, select: { bannerImage: true } });
            files = [p?.bannerImage];
            await prisma.profile.updateMany({ where: { userId: id }, data: { bannerImage: null } });
            break;
        }
        case "bio":
            await prisma.profile.updateMany({ where: { userId: id }, data: { bio: null } });
            break;
        case "resume": {
            const p = await prisma.profile.findUnique({ where: { userId: id }, select: { resumeUrl: true } });
            await prisma.profile.updateMany({ where: { userId: id }, data: { resumeUrl: null, resumeName: null } });
            const publicId = p?.resumeUrl?.split("/raw/upload/")[1]?.replace(/^v\d+\//, "");
            if (publicId?.startsWith(`${id}/`)) {
                await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
                await forgetUploads([p!.resumeUrl]).catch(() => {});
            }
            break;
        }
    }

    // Free the storage (skips anything still used somewhere else).
    for (let i = 0; i < files.length; i += 100) {
        await deleteUnusedUploads(files.slice(i, i + 100), owner).catch(() => {});
    }
}

/** Tell the owner (Inbox + push). */
export async function tellOwner(ownerId: string, caseId: string, text: string) {
    await notify({ recipientId: ownerId, actorId: null, type: "moderation", targetId: caseId, preview: text });
}

/** Flagged things whose 3 days ran out with no appeal: delete them. */
export async function processExpiredCases() {
    const due = await prisma.moderationCase.findMany({
        where: { status: "flagged", deleteAt: { lte: new Date() } },
        take: 50,
    });
    for (const c of due) {
        try {
            await removeTarget(c.targetType as TargetType, c.targetId);
            await prisma.moderationCase.update({
                where: { id: c.id },
                data: { status: "removed", resolvedAt: new Date() },
            });
        } catch (err) {
            console.error("processExpiredCases failed:", c.id, err);
        }
    }
    return due.length;
}

/** Deletes everything a person uploaded, then the account itself. */
export async function deleteAccount(userId: string) {
    try {
        for (const resource_type of ["image", "raw"] as const) {
            let more = true;
            for (let i = 0; more && i < 20; i++) {
                const res = await cloudinary.api.delete_resources_by_prefix(`${userId}/`, { resource_type });
                more = !!res.partial;
            }
        }
    } catch (err) {
        console.error("deleteAccount: cloudinary cleanup failed", err);
    }
    const files = await prisma.storedFile.findMany({ where: { userId }, select: { url: true } });
    await forgetUploads(files.map((f) => f.url));
    await prisma.driveFile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
}
