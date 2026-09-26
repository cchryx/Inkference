"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import ImageField from "@/components/general/photo-editor/ImageField";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { commitStaged, isStaged, release, unstage } from "@/lib/pendingUploads";

type Props = {
    title: string;
    /** What it is, in words: "profile picture", "banner". */
    noun: string;
    value: string | undefined;
    isLoading?: boolean;
    /** Name used for the 5-minute change limit. */
    statusKey: "image" | "bannerImage";
    aspect: number;
    variant: "icon" | "wide";
    /** Saves the new link ("" removes it). */
    save: (url: string) => Promise<{ error: string | null | undefined }>;
};

/**
 * Pick a picture (or paste a link), crop it, then press Save.
 * It's only uploaded when you save, and the old one is deleted after.
 */
export default function ImageSettingForm({ title, noun, value, isLoading, statusKey, aspect, variant, save }: Props) {
    const router = useRouter();
    const [saved, setSaved] = useState(value ?? "");
    const [image, setImage] = useState(value ?? "");
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<{ canChange: boolean; timeLeft: string | null }>({
        canChange: true,
        timeLeft: null,
    });

    // The saved picture arrived (or changed): show it.
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        setSaved(value ?? "");
        setImage(value ?? "");
    }

    useEffect(() => {
        if (!isLoading) getProfileChangeStatus(statusKey).then(setStatus);
    }, [isLoading, statusKey]);

    const changed = image !== saved;

    const reset = () => {
        if (isStaged(image)) unstage(image);
        setImage(saved);
    };

    const handleSave = async () => {
        setIsPending(true);
        try {
            // Upload happens only now.
            const committed = await commitStaged([image]);
            if (committed.error !== undefined) {
                toast.error(committed.error);
                return;
            }
            const url = committed.urls[0];
            const { error } = await save(url);
            if (error) {
                toast.error(error);
                reset(); // also deletes the upload we just made
                return;
            }
            release([image]);
            setSaved(url);
            setImage(url);
            toast.success(url ? `${title} updated.` : `${title} removed.`);
            getProfileChangeStatus(statusKey).then(setStatus);
            router.refresh();
        } finally {
            setIsPending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className={variant === "icon" ? "h-28 w-28 rounded-lg" : "h-32 w-full rounded-lg"} />
                <Skeleton className="h-8 w-24 rounded-md" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
            <h1 className="text-base font-semibold">{title}</h1>

            <div className={isPending || !status.canChange ? "pointer-events-none opacity-60" : undefined}>
                <ImageField
                    label={title}
                    hideLabel
                    value={image}
                    onChange={setImage}
                    aspect={aspect}
                    folder="profile"
                    variant={variant}
                />
            </div>

            <p className="flex items-start gap-1 text-xs text-muted-foreground">
                <AlertCircle className="size-3.5 shrink-0 mt-px" />
                {status.canChange
                    ? `Uploads when you press Save. You can change it every 5 minutes.`
                    : `You can change your ${noun} again in ${status.timeLeft}.`}
            </p>

            <div className="flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer"
                    onClick={handleSave}
                    disabled={!changed || isPending || !status.canChange}
                >
                    {isPending && <Loader size={4} color="text-white" />}
                    Save
                </Button>
                {changed && !isPending && (
                    <Button type="button" size="sm" variant="outline" className="cursor-pointer" onClick={reset}>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}
