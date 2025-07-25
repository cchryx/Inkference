"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/general/Skeleton";

const MAX_LINES = 8;

const ChangeBioForm = () => {
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [bio, setBio] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // simulate loading delay
        return () => clearTimeout(timer);
    }, []);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        // const formData = new FormData(evt.currentTarget);

        // const { error } = await changePasswordAction(formData);

        // if (error) {
        //     toast.error(error);
        // } else {
        //     toast.success("Password changed successfully.");
        //     (evt.target as HTMLFormElement).reset();
        // }

        setIsPending(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const lineCount = value.split("\n").length;

        if (lineCount <= MAX_LINES) {
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
                <Label htmlFor="newBio">New Bio</Label>
                <Textarea
                    id="newBio"
                    name="v"
                    value={bio}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    rows={4}
                    className="resize-none max-h-[8lh] scrollbar-no-buttons"
                />
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Bio
            </Button>
        </form>
    );
};

export default ChangeBioForm;
