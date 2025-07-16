"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type SignoutButtonProps = {
    className?: string;
    children?: React.ReactNode;
};

export const SignoutButton = ({ className, children }: SignoutButtonProps) => {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleClick() {
        await signOut({
            fetchOptions: {
                onRequest: () => {
                    setIsPending(true);
                },
                onResponse: () => {
                    setIsPending(false);
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                },
                onSuccess: () => {
                    toast.success("You’ve logged out. See you soon!");
                    router.push("/auth/signin");
                },
            },
        });
    }

    if (children) {
        return (
            <span
                onClick={handleClick}
                className={className}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                {children}
            </span>
        );
    }

    return (
        <Button
            onClick={handleClick}
            size="sm"
            variant="destructive"
            disabled={isPending}
            className={`cursor-pointer ${className}`}
        >
            {isPending && <Loader size={5} color="text-white" />}
            Sign out
        </Button>
    );
};
