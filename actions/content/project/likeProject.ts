"use server";

import { toggleReaction } from "@/lib/toggleReaction";

/**
 * Like or unlike a project.
 * `_userId` is ignored: the signed-in user is used, so nobody can
 * like on someone else's behalf.
 */
export async function likeProject(projectId: string, _userId?: string) {
    try {
        const { error, active } = await toggleReaction("project", "like", projectId);
        if (error) return { error };
        return { error: null, liked: active };
    } catch (error) {
        console.error("likeProject failed:", error);
        return { error: "Internal server error." };
    }
}
