"use server";

import { toggleReaction } from "@/lib/toggleReaction";

/**
 * Save or unsave a project.
 * `_userId` is ignored: the signed-in user is used, so nobody can
 * save on someone else's behalf.
 */
export async function saveProject(projectId: string, _userId?: string) {
    try {
        const { error, active } = await toggleReaction("project", "save", projectId);
        if (error) return { error };
        return { error: null, saved: active };
    } catch (error) {
        console.error("saveProject failed:", error);
        return { error: "Internal server error." };
    }
}
