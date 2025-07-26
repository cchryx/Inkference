"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import Loader from "../general/Loader";
import { changeUserAction } from "@/actions/changeUserAction";

export const ChooseUsernameForm = () => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsPending(true);

        const formData = new FormData(event.target as HTMLFormElement);

        const { error } = await changeUserAction(formData, "username");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Updated username successfully.");
            router.push("/");
        }

        setIsPending(false);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-white px-4">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Complete Your Profile
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">
                        You need to choose a username to continue. This will be
                        your unique identity across the platform.
                    </p>
                </div>

                <form action="" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            disabled={isPending}
                            placeholder="e.g. monkeyking123"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full cursor-pointer"
                        disabled={isPending}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Choose Username
                    </Button>
                </form>
            </div>
        </div>
    );
};
