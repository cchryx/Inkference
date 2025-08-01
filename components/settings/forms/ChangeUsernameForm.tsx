"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/general/Loader";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/general/Skeleton";
import { changeUserAction } from "@/actions/auth/changeUser";
import { useRouter } from "next/navigation";

type Props = {
    username: string;
    isLoading?: boolean;
};

const ChangeUsernameForm = ({ username, isLoading }: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            getProfileChangeStatus("username").then(setStatus);
        }
    }, [isLoading]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeUserAction(formData, "username");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Username changed successfully.");
            getProfileChangeStatus("username").then(setStatus);
            router.refresh();
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
            <h1 className="text-lg">Change Username</h1>
            <div className="flex flex-col gap-2">
                <Label htmlFor="username">New Username</Label>
                <Input
                    id="username"
                    name="username"
                    defaultValue={username}
                    disabled={isPending || !status.canChange}
                />
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your username now. You’ll be limited to one change every 90 days."
                        : `You can change your username again in ${status.timeLeft}.`}
                </p>
            </div>
            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Username
            </Button>
        </form>
    );
};

export default ChangeUsernameForm;
