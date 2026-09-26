"use client";

import { useEffect, useState, JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { linkSocial, unlinkAccount } from "@/lib/auth-client";
import type { LinkedAccount } from "@/actions/auth/getLinkedAccounts";

type Provider = "google" | "github";

type Props = {
    accounts: LinkedAccount[];
    // From the URL after coming back from Google/GitHub.
    linkError?: string;
    linked?: string;
};

const PROVIDERS: Record<Provider, { label: string; icon: JSX.Element }> = {
    google: { label: "Google", icon: <FcGoogle className="text-xl" /> },
    github: {
        label: "GitHub",
        icon: <FaGithub className="text-xl text-black" />,
    },
};

const LINK_ERRORS: Record<string, string> = {
    account_already_linked_to_different_user:
        "That account is already used by a different Inkference user.",
    unable_to_link_account: "Couldn't link that account. Please try again.",
};

const RETURN_URL = "/settings?section=authentication";

const ChangeSigninForm = ({ accounts, linkError, linked }: Props) => {
    const router = useRouter();
    const [pending, setPending] = useState<string | null>(null);

    // Show the result of a link attempt once, then clean up the URL.
    useEffect(() => {
        if (!linkError && !linked) return;

        if (linkError) {
            toast.error(
                LINK_ERRORS[linkError.toLowerCase()] ??
                    "Couldn't link that account. Please try again."
            );
        } else if (linked && linked in PROVIDERS) {
            toast.success(`${PROVIDERS[linked as Provider].label} linked.`);
        }
        router.replace(RETURN_URL);
    }, [linkError, linked, router]);

    const hasPassword = accounts.some((a) => a.providerId === "credential");
    const isLastMethod = accounts.length <= 1;

    async function handleLink(provider: Provider) {
        setPending(provider);
        await linkSocial({
            provider,
            callbackURL: `${RETURN_URL}&linked=${provider}`,
            errorCallbackURL: RETURN_URL,
            fetchOptions: {
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                    setPending(null);
                },
            },
        });
        // On success the browser is sent to Google/GitHub.
    }

    async function handleUnlink(account: LinkedAccount, label: string) {
        setPending(account.providerId);
        await unlinkAccount({
            accountId: account.id,
            fetchOptions: {
                onError: (ctx) => {
                    const code = ctx.error.code;
                    toast.error(
                        code === "SESSION_NOT_FRESH"
                            ? "For security, please sign out and sign in again before unlinking."
                            : ctx.error.message
                    );
                },
                onSuccess: () => {
                    toast.success(`${label} unlinked.`);
                    router.refresh();
                },
            },
        });
        setPending(null);
    }

    return (
        <div className="w-full space-y-3 border border-gray-200 p-4 rounded-md">
            <div className="space-y-1">
                <h1 className="text-base font-semibold">Sign-in Methods</h1>
                <p className="text-sm text-muted-foreground">
                    Link Google or GitHub to sign in to this same account with
                    any of them.
                </p>
            </div>

            {/* Email & password */}
            <div className="flex items-center justify-between border rounded-md p-4">
                <div className="flex items-center gap-2 font-medium">
                    <Mail className="size-5" />
                    Email &amp; Password
                </div>
                <span className="text-sm text-muted-foreground">
                    {hasPassword ? "Set up" : "No password yet"}
                </span>
            </div>

            {/* Google / GitHub */}
            {(Object.keys(PROVIDERS) as Provider[]).map((provider) => {
                const { label, icon } = PROVIDERS[provider];
                const account = accounts.find(
                    (a) => a.providerId === provider
                );
                const isPending = pending === provider;

                return (
                    <div
                        key={provider}
                        className="flex items-center justify-between gap-4 border rounded-md p-4"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 font-medium">
                                {icon}
                                {label}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {account ? "Linked" : "Not linked"}
                            </span>
                        </div>

                        {account ? (
                            <Button
                                variant="outline"
                                className="cursor-pointer"
                                disabled={!!pending || isLastMethod}
                                title={
                                    isLastMethod
                                        ? "You need at least one way to sign in."
                                        : undefined
                                }
                                onClick={() => handleUnlink(account, label)}
                            >
                                {isPending && <Loader size={5} />}
                                Unlink
                            </Button>
                        ) : (
                            <Button
                                className="cursor-pointer"
                                disabled={!!pending}
                                onClick={() => handleLink(provider)}
                            >
                                {isPending && (
                                    <Loader size={5} color="text-white" />
                                )}
                                Link
                            </Button>
                        )}
                    </div>
                );
            })}

            {isLastMethod && (
                <p className="text-xs text-muted-foreground">
                    This is your only way to sign in, so it can&apos;t be
                    unlinked. Add another method first.
                </p>
            )}
        </div>
    );
};

export default ChangeSigninForm;
