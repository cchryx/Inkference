"use server";

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signinEmailAction(formData: FormData) {
    const usernameOrEmail = String(formData.get("usernameOrEmail"));
    if (!usernameOrEmail) return { error: "Username or email is required." };
    const password = String(formData.get("password"));
    if (!password) return { error: "Password is required." };

    try {
        if (usernameOrEmail.includes("@")) {
            await auth.api.signInEmail({
                headers: await headers(),
                body: {
                    email: usernameOrEmail,
                    password,
                },
            });
        } else {
            await auth.api.signInUsername({
                headers: await headers(),
                body: {
                    username: usernameOrEmail,
                    password,
                },
            });
        }

        return { error: null };
    } catch (error) {
        if (error instanceof APIError) {
            const errorCode = error.body
                ? (error.body.code as ErrorCode)
                : "UNKNOWN";

            switch (errorCode) {
                case "EMAIL_NOT_VERIFIED":
                    redirect("/auth/verify?error=email_not_verified");
                default:
                    return {
                        error:
                            `${error.message}.` || "An unknown error occurred.",
                    };
            }
        } else {
            return { error: "Internal server error." };
        }
    }
}
