"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/general/Loader";
import { changeUsernameAction } from "@/actions/changeUsernameAction";
import { getProfileChangeStatus } from "@/actions/getProfileChangeStatus";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/general/Skeleton";

const ChangeUsernameForm = () => {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    useEffect(() => {
        setIsLoadingStatus(true);
        getProfileChangeStatus("username")
            .then(setStatus)
            .finally(() => setIsLoadingStatus(false));
    }, []);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeUsernameAction(formData);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Username changed successfully.");
            (evt.target as HTMLFormElement).reset();
            setIsLoadingStatus(true);
            getProfileChangeStatus("username").then(setStatus);
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
                    <h1 className="text-lg">Change Username</h1>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="username">New Username</Label>
                        <Input
                            id="username"
                            name="username"
                            disabled={isPending || !status.canChange}
                        />
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-5 h-5" />
                            {status.canChange
                                ? "You can change your username now. You’ll be limited to one change every 90 days."
                                : `You can change your username again in ${status.timeLeft}.`}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={isPending || !status.canChange}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Change Username
                    </Button>
                </>
            )}
        </form>
    );
};

export default ChangeUsernameForm;
