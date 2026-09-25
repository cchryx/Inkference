"use server";

import { toggleReaction } from "@/lib/toggleReaction";

/**
 * Save or unsave a post.
 * `_userId` is ignored: the signed-in user is used, so nobody can
 * save on someone else's behalf.
 */
export async function savePost(postId: string, _userId?: string) {
    try {
        const { error, active } = await toggleReaction("post", "save", postId);
        if (error) return { error };
        return { error: null, saved: active };
    } catch (error) {
        console.error("savePost failed:", error);
        return { error: "Internal server error." };
    }
}
