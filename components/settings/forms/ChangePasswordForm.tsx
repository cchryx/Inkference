"use client";

import { useState, useEffect } from "react";
import { changePasswordAction } from "@/actions/changePasswordAction";
import { PasswordInput } from "@/components/auth/PasswordInput";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/general/Skeleton";
import { toast } from "sonner";

const ChangePasswordForm = () => {
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);

        const { error } = await changePasswordAction(formData);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Password changed successfully.");
            (evt.target as HTMLFormElement).reset();
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <Skeleton className="h-9 w-36 rounded-md" />
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Password</h1>

            <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    disabled={isPending}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                    id="newPassword"
                    name="newPassword"
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
                Change Password
            </Button>
        </form>
    );
};

export default ChangePasswordForm;
