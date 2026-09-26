"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "@/lib/auth-client";
import Loader from "../general/Loader";

interface SigninOathButtonProps {
    provider: "google" | "github";
    signUp?: boolean;
}

const STYLES = {
    // Google's look: white with their coloured G.
    google: {
        name: "Google",
        icon: <FcGoogle className="size-5" />,
        className: "bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50",
        loader: "text-gray-700",
    },
    // GitHub's look: near-black with the white mark.
    github: {
        name: "GitHub",
        icon: <FaGithub className="size-5" />,
        className: "bg-[#24292f] text-white hover:bg-[#32383f]",
        loader: "text-white",
    },
} as const;

export const SigninOathButton = ({ provider, signUp }: SigninOathButtonProps) => {
    const [isPending, setIsPending] = useState(false);
    const s = STYLES[provider];

    async function handleClick() {
        setIsPending(true);
        await signIn.social({
            provider,
            callbackURL: "/",
            errorCallbackURL: "/auth/signin/error",
        });
        setIsPending(false);
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className={`flex h-10 w-full items-center justify-center gap-2.5 rounded-md px-4 text-sm font-medium shadow-sm transition cursor-pointer disabled:opacity-60 ${s.className}`}
        >
            {isPending ? <Loader size={5} color={s.loader} /> : s.icon}
            Sign {signUp ? "up" : "in"} with {s.name}
        </button>
    );
};
