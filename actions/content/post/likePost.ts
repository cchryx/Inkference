"use server";

import { toggleReaction } from "@/lib/toggleReaction";

/**
 * Like or unlike a post.
 * `_userId` is ignored: the signed-in user is used, so nobody can
 * like on someone else's behalf.
 */
export async function likePost(postId: string, _userId?: string) {
    try {
        const { error, active } = await toggleReaction("post", "like", postId);
        if (error) return { error };
        return { error: null, liked: active };
    } catch (error) {
        console.error("likePost failed:", error);
        return { error: "Internal server error." };
    }
}
