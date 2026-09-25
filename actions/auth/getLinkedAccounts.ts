"use server";

import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type LinkedAccount = {
    id: string;
    providerId: string;
    accountId: string;
};

export async function getLinkedAccounts(): Promise<{
    error: string | null;
    accounts: LinkedAccount[];
    hasPassword: boolean;
}> {
    try {
        const accounts = await auth.api.listUserAccounts({
            headers: await headers(),
        });

        return {
            error: null,
            accounts: accounts.map(({ id, providerId, accountId }) => ({
                id,
                providerId,
                accountId,
            })),
            // The email/password sign-in is stored as a "credential" account.
            hasPassword: accounts.some((a) => a.providerId === "credential"),
        };
    } catch (error) {
        const message =
            error instanceof APIError
                ? error.message?.trim() || "An unknown error occurred."
                : "Internal server error.";

        return { error: message, accounts: [], hasPassword: false };
    }
}
