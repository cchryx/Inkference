"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { changeNameAction } from "@/actions/changeNameAction";
import { getProfileChangeStatus } from "@/actions/getProfileChangeStatus";

import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ChangeNameForm = () => {
    const [isPending, setIsPending] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [nameStatus, setNameStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        setIsLoadingStatus(true);
        getProfileChangeStatus("name")
            .then(setNameStatus)
            .finally(() => setIsLoadingStatus(false));
    }, []);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeNameAction(formData);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Name changed successfully.");
            (evt.target as HTMLFormElement).reset();

            // Refresh status after successful change
            setIsLoadingStatus(true);
            await getProfileChangeStatus("name").then(setNameStatus);
            setIsLoadingStatus(false);
        }

        setIsPending(false);
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            {isLoadingStatus ? (
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32 rounded-md" /> {/* Title */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded-md" />{" "}
                        {/* Label */}
                        <Skeleton className="h-10 w-full rounded-md" />{" "}
                        {/* Input */}
                        <Skeleton className="h-4 w-3/4 rounded-md" />{" "}
                        {/* Info text */}
                    </div>
                    <Skeleton className="h-10 w-40 rounded-md" /> {/* Button */}
                </div>
            ) : (
                <>
                    <h1 className="text-lg">Change Name</h1>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">New Name</Label>
                        <Input
                            id="name"
                            name="name"
                            disabled={isPending || !nameStatus.canChange}
                        />
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-5 h-5" />
                            {nameStatus.canChange
                                ? "You can change your name now. You’ll be limited to one change every 30 days."
                                : `You can change your name again in ${nameStatus.timeLeft}.`}
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="cursor-pointer"
                        disabled={isPending || !nameStatus.canChange}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Change Name
                    </Button>
                </>
            )}
        </form>
    );
};

export default ChangeNameForm;
