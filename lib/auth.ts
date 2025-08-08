import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/argon2";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getValidDomains, normalizeName } from "@/lib/utils";
import { sendEmailAction } from "@/actions/auth/sendEmail";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        google: {
            clientId: String(process.env.GOOGLE_CLIENT_ID),
            clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
        },
        github: {
            clientId: String(process.env.GITHUB_CLIENT_ID),
            clientSecret: String(process.env.GITHUB_CLIENT_SECRET),
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        autoSignIn: false,
        password: {
            hash: hashPassword,
            verify: verifyPassword,
        },
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            const email = user.email;

            await sendEmailAction({
                to: email,
                subject: "Reset your password",
                meta: {
                    description:
                        "Please click the link below to reset your password.",
                    link: String(url),
                },
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 60 * 60, // 1 hour
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const email = user.email;

            const link = new URL(url);
            link.searchParams.set("callbackURL", "/auth/verify");

            await sendEmailAction({
                to: email,
                subject: "Verify your email address",
                meta: {
                    description:
                        "Please verify your email address to complete the registration process.",
                    link: String(link),
                },
            });
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            // This is ONLY for the before hook logic
            if (ctx.path === "/sign-up/email") {
                const email = ctx.body.email;
                const domain = email.split("@")[1];

                const VALID_DOMAINS = getValidDomains();
                if (!VALID_DOMAINS.includes(domain)) {
                    throw new APIError("BAD_REQUEST", {
                        message: "Invalid email domain.",
                    });
                }

                const name = normalizeName(ctx.body.name);

                if (!name.trim() || !/[a-zA-Z]/.test(name)) {
                    throw new APIError("BAD_REQUEST", {
                        message: "Name must contain at least one letter.",
                    });
                } else if (name.length > 50) {
                    throw new APIError("BAD_REQUEST", {
                        message: "Name cannot be longer than 50 characters.",
                    });
                }

                return {
                    context: {
                        ...ctx,
                        body: {
                            ...ctx.body,
                            name,
                        },
                    },
                };
            }
        }),
    },
    session: {
        expiresIn: 30 * 24 * 60 * 60, // 30 days
    },
    account: {
        accountLinking: {
            enabled: true,
        },
    },
    advanced: {
        database: {
            generateId: false,
        },
    },
    plugins: [
        nextCookies(),
        username({
            minUsernameLength: 5,
            maxUsernameLength: 30,
        }),
    ],
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
