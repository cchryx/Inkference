"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { signinEmailAction } from "@/actions/auth/signinEmailAction";
import Link from "next/link";
import { PasswordInput } from "./PasswordInput";
import Loader from "../general/Loader";

export const SigninForm = () => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsPending(true);

        const formData = new FormData(event.target as HTMLFormElement);

        const { error } = await signinEmailAction(formData);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Signed in successfully.");
            router.push("/");
        }

        setIsPending(false);
    }

    return (
        <form
            action=""
            onSubmit={handleSubmit}
            className="max-w-sm w-full space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="usernameOrEmail">Username or Email</Label>
                <Input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    disabled={isPending}
                />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm italic text-muted-foreground hover:text-forground"
                    >
                        Forgot password?
                    </Link>
                </div>
                <PasswordInput
                    id="password"
                    name="password"
                    disabled={isPending}
                />
            </div>

            <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Sign In
            </Button>
        </form>
    );
};
