"use server";

import { APIError } from "better-auth/api";
import { auth, ErrorCode } from "@/lib/auth";
import { headers } from "next/headers";

export async function changePasswordAction(formData: FormData) {
    const currentPassword = String(formData.get("currentPassword"));
    if (!currentPassword)
        return { error: "Please enter your current password." };

    const newPassword = String(formData.get("newPassword"));
    if (!newPassword) return { error: "Please enter your new password." };

    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
        return { error: "New password and confirm password do not match." };
    }

    try {
        await auth.api.changePassword({
            headers: await headers(),
            body: { currentPassword, newPassword },
        });

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            const errorCode = error.body
                ? (error.body.code as ErrorCode)
                : "UNKNOWN";

            switch (errorCode) {
                default:
                    let message =
                        error.message?.trim() || "An unknown error occurred";
                    message = message
                        .split(/(?<=[.!?])\s+/)
                        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(" ");
                    if (!/[.!?]$/.test(message)) message += ".";

                    return {
                        error: `${message}` || "An unknown error occurred.",
                    };
            }
        } else {
            return { error: "Internal server error." };
        }
    }
}
