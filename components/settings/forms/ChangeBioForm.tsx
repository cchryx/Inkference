"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/general/Skeleton";
import { changeProfileAction } from "@/actions/profile/changeProfile";
import { toast } from "sonner";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { AlertCircle } from "lucide-react";

const MAX_LINES = 12;
const MAX_CHARS = 800;

type ChangeBioFormProps = {
    biography: string;
    isLoading?: boolean;
};

const ChangeBioForm = ({
    biography,
    isLoading = false,
}: ChangeBioFormProps) => {
    const [isPending, setIsPending] = useState(false);
    const [bio, setBio] = useState(biography);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            setBio(biography);
            getProfileChangeStatus("bio").then(setStatus);
        }
    }, [biography, isLoading]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData(evt.currentTarget);

        const { error } = await changeProfileAction(formData, "bio");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Bio changed successfully.");
            getProfileChangeStatus("bio").then(setStatus);
        }

        setIsPending(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const lineCount = value.split("\n").length;

        if (lineCount <= MAX_LINES && value.length <= MAX_CHARS) {
            setBio(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const lineCount = bio.split("\n").length;
        if (e.key === "Enter" && lineCount >= MAX_LINES) {
            e.preventDefault();
        }
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-[8lh] w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-9 w-32 rounded-md" />
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Bio</h1>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="bio">New Bio</Label>
                    <span className="text-xs text-gray-500">
                        {MAX_CHARS - bio.length} characters left
                    </span>
                </div>

                <Textarea
                    id="bio"
                    name="bio"
                    value={bio}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isPending || !status.canChange}
                    rows={4}
                    className="resize-none max-h-[8lh] scrollbar-no-buttons"
                />

                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your bio now. You’ll be limited to one change every 5 minutes."
                        : `You can change your bio again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Bio
            </Button>
        </form>
    );
};

export default ChangeBioForm;
