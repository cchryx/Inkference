"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canViewGallery, canViewPost, canViewProject, getViewerContext } from "@/lib/visibility";
import { describeTarget } from "@/lib/moderation";
import { getStaffIds } from "@/lib/admin";
import { notify } from "@/lib/notify";
import { REPORT_REASONS, type ReportTarget } from "@/lib/reportReasons";

/** Report a post, project, gallery or photo to the admins. */
export async function reportContent(input: { targetType: ReportTarget; targetId: string; reason: string; details?: string }) {
    const session = await getSession();
    const me = session?.user?.id;
    if (!me) return { error: "Sign in to report something." };

    const type = input.targetType;
    if (!["post", "project", "gallery", "photo"].includes(type)) return { error: "Can't report that." };
    const reason = REPORT_REASONS.find((r) => r.id === input.reason);
    if (!reason) return { error: "Pick a reason." };
    const details = String(input.details ?? "").trim().slice(0, 500) || null;

    // You can only report things you can actually see.
    const viewer = await getViewerContext(me);
    let galleryId: string | null = null;
    if (type === "photo") {
        galleryId = (await prisma.photo.findUnique({ where: { id: input.targetId }, select: { galleryId: true } }))?.galleryId ?? null;
    }
    const visible =
        type === "post"
            ? await canViewPost(input.targetId, viewer)
            : type === "project"
              ? await canViewProject(input.targetId, viewer)
              : galleryId || type === "gallery"
                ? await canViewGallery(galleryId ?? input.targetId, viewer)
                : false;
    if (!visible) return { error: "That's not available." };

    const target = await describeTarget(type, input.targetId);
    if (!target) return { error: "That's not available." };
    if (target.ownerId === me) return { error: "You can't report your own stuff." };

    await prisma.report.upsert({
        where: { reporterId_targetType_targetId: { reporterId: me, targetType: type, targetId: input.targetId } },
        update: { reason: reason.id, details, status: "open", createdAt: new Date(), resolvedAt: null, resolvedBy: null },
        create: { reporterId: me, ownerId: target.ownerId, targetType: type, targetId: input.targetId, reason: reason.id, details },
    });

    // Tell the staff (one notification per reported thing, kept up to date).
    const count = await prisma.report.count({ where: { targetType: type, targetId: input.targetId, status: "open" } });
    const staff = (await getStaffIds()).filter((id) => id !== target.ownerId);
    const what = target.label.split(":")[0] || type;
    await Promise.all(
        staff.map((recipientId) =>
            notify({
                recipientId,
                actorId: null,
                type: "report",
                targetId: `${type}:${input.targetId}`,
                preview: `${what} reported for ${reason.label.toLowerCase()}${count > 1 ? ` (${count} reports)` : ""}.`,
            })
        )
    );
    return { error: null };
}
