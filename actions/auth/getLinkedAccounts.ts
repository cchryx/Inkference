"use server";

import { APIError } from "better-auth/api";
import { auth, ErrorCode } from "@/lib/auth";
import { headers } from "next/headers";

export async function getLinkedAccounts() {
    try {
        const accounts = await auth.api.listUserAccounts({
            headers: await headers(),
        });

        const hasPassword = accounts?.some(
            (account: any) => account.provider === "credential"
        );

        return {
            error: null,
            accounts,
            hasPassword,
        };
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
                error: message || "An unknown error occurred.",
                accounts: [],
                hasPassword: false,
            };
        }

        return {
            error: "Internal server error.",
            accounts: [],
            hasPassword: false,
        };
    }
}
