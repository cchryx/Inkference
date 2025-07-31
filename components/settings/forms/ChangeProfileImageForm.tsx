"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/general/Loader";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { AlertCircle, User } from "lucide-react";
import { Skeleton } from "@/components/general/Skeleton";
import { changeUserAction } from "@/actions/auth/changeUser";
import { set } from "date-fns";

type Props = {
    profileImage: string | undefined;
    isLoading?: boolean;
};

const ChangeProfileImageForm = ({ profileImage, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState({
        canChange: true,
        timeLeft: null as string | null,
    });
    const [imagePreview, setImagePreview] = useState(profileImage || "");

    useEffect(() => {
        if (!isLoading) {
            setImagePreview(profileImage || "");
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

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setImagePreview(e.target.value);
    }

    function handleRemoveImage() {
        setImagePreview("");
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
                <Skeleton className="h-6 w-40 rounded-md" />
                <div className="space-y-2">
                    <div className="flex gap-4 w-full items-start">
                        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
                        <div className="flex flex-col gap-2 flex-1">
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
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                className="h-24 w-24 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            />
                        ) : (
                            <User className="text-white w-10 h-10" />
                        )}
                    </div>

                    <div className="gap-2 flex flex-col w-full">
                        <Label htmlFor="image">New Image URL</Label>
                        <Input
                            id="image"
                            name="image"
                            value={imagePreview}
                            onChange={handleInputChange}
                            disabled={isPending || !status.canChange}
                        />
                        {imagePreview && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRemoveImage}
                                className="w-fit text-xs px-2 py-1 h-auto cursor-pointer"
                            >
                                Remove Image
                            </Button>
                        )}
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
