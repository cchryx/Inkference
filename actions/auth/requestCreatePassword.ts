"use server";

import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { getLinkedAccounts } from "./getLinkedAccounts";
import { getSession } from "@/lib/session";

/**
 * For users who signed up with Google/GitHub: emails them a link to
 * create a password (same flow as "forgot password").
 */
export async function requestCreatePassword() {
    const session = await getSession();
    if (!session) return { error: "You must be signed in." };

    const { hasPassword, error } = await getLinkedAccounts();
    if (error) return { error };
    if (hasPassword) return { error: "You already have a password." };

    try {
        await auth.api.requestPasswordReset({
            body: {
                email: session.user.email,
                redirectTo: "/auth/create-password",
            },
        });
        return { error: null, email: session.user.email };
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message || "Could not send the email." };
        }
        return { error: "Internal server error." };
    }
}
