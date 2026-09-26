import { prisma } from "@/lib/prisma";
import { recordEngagement, removeEngagement } from "@/lib/engagement";
import { notify } from "@/lib/notify";
import { canViewPost, canViewProject, getViewerContext } from "@/lib/visibility";
import { getSession } from "@/lib/session";

type Target = "post" | "project";
type Reaction = "like" | "save";

const RELATION = {
    post: { like: "postsLiked", save: "postsSaved" },
    project: { like: "projectsLiked", save: "projectsSaved" },
} as const;

/**
 * Like/unlike or save/unsave a post or project for the SIGNED-IN user.
 * (The user always comes from the session, never from the browser.)
 */
export async function toggleReaction(target: Target, reaction: Reaction, id: string) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { error: "You must be signed in." as string | null, active: false };

    const userData = await prisma.userData.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true },
    });

    // Only check whether *I* already reacted, instead of loading everyone.
    const mine = { where: { id: userData.id }, select: { id: true } };
    const relationField = reaction === "like" ? "likes" : "saves";
    const existing =
        target === "post"
            ? await prisma.post.findUnique({
                  where: { id },
                  select: { id: true, userData: { select: { userId: true } }, [relationField]: mine },
              })
            : await prisma.project.findUnique({
                  where: { id },
                  select: { id: true, userData: { select: { userId: true } }, [relationField]: mine },
              });

    // You can only react to things you're allowed to see.
    const viewer = await getViewerContext(userId);
    const visible = target === "post" ? await canViewPost(id, viewer) : await canViewProject(id, viewer);
    if (!existing || !visible) return { error: `${target === "post" ? "Post" : "Project"} not found.`, active: false };

    const already = ((existing as Record<string, unknown>)[relationField] as unknown[]).length > 0;

    await prisma.userData.update({
        where: { id: userData.id },
        data: {
            [RELATION[target][reaction]]: { [already ? "disconnect" : "connect"]: { id } },
        },
    });

    if (already) {
        await removeEngagement(reaction, target, id, userData.id);
    } else {
        await recordEngagement(reaction, target, [id], userData.id);
        // Likes notify the owner (grouped). Saves are private, so no notification.
        if (reaction === "like") {
            const ownerId = (existing as unknown as { userData: { userId: string } }).userData.userId;
            await notify({ recipientId: ownerId, actorId: userId, type: "like", targetType: target, targetId: id });
        }
    }

    return { error: null, active: !already };
}
