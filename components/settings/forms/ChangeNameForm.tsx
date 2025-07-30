"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";

import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeUserAction } from "@/actions/auth/changeUserAction";

type Props = {
    name: string;
    isLoading?: boolean;
};

const ChangeNameForm = ({ name, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            getProfileChangeStatus("name").then(setStatus);
        }
    }, [isLoading]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeUserAction(formData, "name");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Name changed successfully.");
            getProfileChangeStatus("name").then(setStatus);
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
                <Skeleton className="h-6 w-32 rounded-md" /> {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-md" /> {/* Label */}
                    <Skeleton className="h-10 w-full rounded-md" />{" "}
                    {/* Input */}
                    <Skeleton className="h-4 w-3/4 rounded-md" />{" "}
                    {/* Info text */}
                </div>
                <Skeleton className="h-10 w-40 rounded-md" /> {/* Button */}
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Name</h1>

            <div className="flex flex-col gap-2">
                <Label htmlFor="name">New Name</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={name}
                    disabled={isPending || !status.canChange}
                />
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your name now. You’ll be limited to one change every 30 days."
                        : `You can change your name again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Name
            </Button>
        </form>
    );
};

export default ChangeNameForm;
