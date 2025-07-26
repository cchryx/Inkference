"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/general/Loader";
import { getProfileChangeStatus } from "@/actions/getProfileChangeStatus";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/general/Skeleton";
import { changeUserAction } from "@/actions/changeUserAction";

type Props = {
    profileImage: string | undefined;
    isLoading?: boolean;
};

const ChangeProfileImageForm = ({ profileImage, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            getProfileChangeStatus("image").then(setStatus);
        }
    }, [isLoading]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeUserAction(formData, "image");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Profile image changed successfully.");
            getProfileChangeStatus("image").then(setStatus);
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
                <Skeleton className="h-6 w-40 rounded-md" />
                <div className="space-y-2">
                    <div className="flex gap-4 w-full items-start">
                        {/* Avatar Skeleton */}
                        <Skeleton className="h-24 w-24 rounded-full shrink-0" />

                        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    </div>

                    <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-10 w-40 rounded-md" />
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Profile Image</h1>

            <div className="flex flex-col gap-2 items-start">
                <div className="flex gap-4 w-full">
                    <img
                        src={profileImage}
                        className="h-24 w-24 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    />
                    <div className="gap-2 flex flex-col w-full">
                        <Label htmlFor="image">New Image URL</Label>
                        <Input
                            id="image"
                            name="image"
                            defaultValue={profileImage}
                            disabled={isPending || !status.canChange}
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your profile image now. Changes are limited every 5 minutes."
                        : `You can change your profile image again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Profile Image
            </Button>
        </form>
    );
};

export default ChangeProfileImageForm;
