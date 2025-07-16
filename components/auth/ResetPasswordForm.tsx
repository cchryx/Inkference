"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "./PasswordInput";
import Loader from "../general/Loader";

interface ResetPasswordFormProps {
    token: string;
}

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        const formData = new FormData(evt.currentTarget);

        const password = String(formData.get("password"));
        if (!password) return toast.error("Please enter your email.");

        const confirmPassword = String(formData.get("confirmPassword"));

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match.");
        }

        await resetPassword({
            newPassword: password,
            token,
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
                    toast.success("Password reset successfully.");
                    router.push("/auth/signin");
                },
            },
        });
    }

    return (
        <form className="max-w-sm w-full space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                    id="password"
                    name="password"
                    disabled={isPending}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    disabled={isPending}
                />
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Reset Password
            </Button>
        </form>
    );
};
