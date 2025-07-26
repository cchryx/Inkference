"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";

export async function signupEmailAction(formData: FormData) {
    const name = String(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const username = String(formData.get("username"));
    if (!username) return { error: "Username is required." };
    const email = String(formData.get("email"));
    if (!email) return { error: "Email is required." };
    const password = String(formData.get("password"));
    if (!password) return { error: "Password is required." };

    try {
        await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
                username,
            },
        });

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            const errorCode = error.body
                ? (error.body.code as ErrorCode)
                : "UNKNOWN";

            switch (errorCode) {
                case "USER_ALREADY_EXISTS":
                    return {
                        error: "Oops! Something went wrong, please try again.",
                    };
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
            console.error("Unexpected error:", error);
            return { error: "Internal server error." };
        }
    }
}
