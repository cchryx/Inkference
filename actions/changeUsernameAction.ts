"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";

export async function changeUsernameAction(formData: FormData) {
    const username = String(formData.get("username"));
    if (!username) return { error: "Username is required." };

    try {
        await auth.api.updateUser({
            headers: await headers(),
            body: { username },
        });

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            const errorCode = error.body
                ? (error.body.code as ErrorCode)
                : "UNKNOWN";

            let message = error.message?.trim() || "An unknown error occurred";
            message = message
                .split(/(?<=[.!?])\s+/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
            if (!/[.!?]$/.test(message)) message += ".";

            return { error: message };
        } else {
            return { error: "Internal server error." };
        }
    }
}
