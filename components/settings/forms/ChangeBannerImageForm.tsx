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
import { changeProfileAction } from "@/actions/changeProfileAction";

type Props = {
    bannerImage: string | undefined;
    isLoading?: boolean;
};

const ChangeBannerImageForm = ({ bannerImage, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            getProfileChangeStatus("bannerImage").then(setStatus);
        }
    }, [isLoading]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeProfileAction(formData, "bannerImage");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Banner image changed successfully.");
            getProfileChangeStatus("bannerImage").then(setStatus);
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
                <Skeleton className="h-6 w-40 rounded-md" />
                <div className="space-y-2">
                    {/* Banner Skeleton */}
                    <Skeleton className="h-40 w-full rounded-sm shrink-0" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
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
            <h1 className="text-lg">Change Banner Image</h1>

            <div className="flex flex-col gap-2 items-start">
                <img
                    src={bannerImage}
                    className="h-40 w-full rounded-sm object-cover border border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor="bannerImage">New Banner Image URL</Label>
                <Input
                    id="bannerImage"
                    name="bannerImage"
                    defaultValue={bannerImage}
                    disabled={isPending || !status.canChange}
                />
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your banner image now. Changes are limited every 5 minutes."
                        : `You can change your banner image again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Banner Image
            </Button>
        </form>
    );
};

export default ChangeBannerImageForm;
