"use server";

import { APIError } from "better-auth/api";
import { auth, ErrorCode } from "@/lib/auth";
import { headers } from "next/headers";
import { getLinkedAccounts } from "./getLinkedAccounts";

export async function changePasswordAction(formData: FormData) {
    const {
        accounts,
        error: linkedAccountsError,
        hasPassword,
    } = await getLinkedAccounts();

    if (linkedAccountsError) {
        return { error: linkedAccountsError };
    }

    const newPassword = String(formData.get("newPassword"));
    if (!newPassword) return { error: "Please enter your new password." };

    const confirmPassword = String(formData.get("confirmPassword"));
    if (newPassword !== confirmPassword) {
        return { error: "New password and confirm password do not match." };
    }

    try {
        if (hasPassword) {
            const currentPassword = String(formData.get("currentPassword"));
            if (!currentPassword) {
                return { error: "Please enter your current password." };
            }

            await auth.api.changePassword({
                headers: await headers(),
                body: { currentPassword, newPassword },
            });
        } else {
            await auth.api.setPassword({
                headers: await headers(),
                body: { newPassword },
            });
        }

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

            return {
                error: `${message}` || "An unknown error occurred.",
            };
        } else {
            return { error: "Internal server error." };
        }
    }
}
