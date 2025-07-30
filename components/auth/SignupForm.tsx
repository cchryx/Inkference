"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { signupEmailAction } from "@/actions/auth/signupEmailAction";
import { PasswordInput } from "./PasswordInput";
import Loader from "../general/Loader";

export const SignupForm = () => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsPending(true);

        const formData = new FormData(event.target as HTMLFormElement);

        const { error } = await signupEmailAction(formData);

        if (error) {
            toast.error(error);
        } else {
            toast.success(
                "Signed up successfully. Please check your email to verify your account."
            );
            router.push("/auth/signup/success");
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
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" disabled={isPending} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" disabled={isPending} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    disabled={isPending}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                Sign Up
            </Button>
        </form>
    );
};
