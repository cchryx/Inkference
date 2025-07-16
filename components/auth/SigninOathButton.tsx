"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { signIn } from "@/lib/auth-client";
import Loader from "../general/Loader";

interface SigninOathButtonProps {
    provider: "google" | "github";
    signUp?: boolean;
}

export const SigninOathButton = ({
    provider,
    signUp,
}: SigninOathButtonProps) => {
    const [isPending, setIsPending] = useState(false);

    async function handleClick() {
        setIsPending(true);

        await signIn.social({
            provider,
            callbackURL: "/",
            errorCallbackURL: "/auth/signin/error",
        });

        setIsPending(false);
    }

    const action = signUp ? "Up" : "In";
    const providerName = provider === "google" ? "Google" : "GitHub";

    return (
        <Button
            className="cursor-pointer"
            onClick={handleClick}
            disabled={isPending}
        >
            {isPending && <Loader size={5} color="text-white" />}
            Sign {action} with {providerName}
        </Button>
    );
};
