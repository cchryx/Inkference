"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/general/Modal";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { moderateContent } from "@/actions/admin";
import { previewUrl } from "@/lib/imageUrl";

export type ModTarget =
    | "post"
    | "project"
    | "gallery"
    | "photo"
    | "comment"
    | "profile_image"
    | "banner"
    | "bio"
    | "resume";

const FLAGGABLE: ModTarget[] = ["post", "project", "gallery", "photo"];
const WORDS: Record<ModTarget, string> = {
    post: "post",
    project: "project",
    gallery: "gallery",
    photo: "photo",
    comment: "comment",
    profile_image: "profile picture",
    banner: "banner",
    bio: "bio",
    resume: "resume",
};

type Props = {
    targetType: ModTarget;
    targetId: string;
    /** For posts: its photos, so one can be removed on its own. */
    photos?: string[];
    onClose: () => void;
    /** Called after it was deleted (e.g. go back to the feed). */
    onDeleted?: () => void;
};

/** Admin: flag something for review, or delete it now. The owner is told why. */
export default function ModerateModal({ targetType, targetId, photos = [], onClose, onDeleted }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const canFlag = FLAGGABLE.includes(targetType);
    const [action, setAction] = useState<Action>(canFlag ? "flag" : "delete");
    const [photo, setPhoto] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const words = WORDS[targetType];

    const submit = async () => {
        if (!reason.trim()) return toast.error("Write a reason. The owner will see it.");
        if (action === "photo" && !photo) return toast.error("Pick the photo to remove.");
        setBusy(true);
        const res = await moderateContent(
            action === "photo"
                ? { targetType: "post_photo", targetId, action: "delete", reason, url: photo! }
                : { targetType, targetId, action, reason }
        );
        setBusy(false);
        if (res.error) return toast.error(res.error);
        toast.success(action === "flag" ? "Flagged. The owner has 3 days to appeal." : "Removed. The owner was told why.");
        queryClient.invalidateQueries();
        onClose();
        if (action === "delete") onDeleted?.();
        router.refresh();
    };

    return (
        <Modal open onClose={busy ? () => {} : onClose}>
            <div className="w-[min(92vw,440px)] space-y-4 rounded-xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ShieldAlert className="size-5 text-red-600" /> Moderate {words}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-gray-100 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    {canFlag && (
                        <Option
                            current={action}
                            onPick={setAction}
                            value="flag"
                            title="Flag for review"
                            hint="Hidden right away. Deleted in 3 days unless the owner appeals."
                        />
                    )}
                    <Option current={action} onPick={setAction} value="delete" title="Delete now" hint="Gone right away. The owner is told why." />
                    {targetType === "post" && photos.length > 1 && (
                        <Option current={action} onPick={setAction} value="photo" title="Remove one photo" hint="Keep the post, delete just one of its photos." />
                    )}
                </div>

                {action === "photo" && (
                    <div className="grid grid-cols-4 gap-2">
                        {photos.map((url) => (
                            <button
                                key={url}
                                type="button"
                                onClick={() => setPhoto(url)}
                                className={`aspect-square overflow-hidden rounded-md ring-2 cursor-pointer ${
                                    photo === url ? "ring-red-500" : "ring-transparent"
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl(url, 200)} alt="" className="size-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-600">Reason (the owner sees this)</span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="e.g. Nudity isn't allowed on Inkference."
                        className="w-full resize-none rounded-lg p-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                    />
                </label>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={busy} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={submit}
                        disabled={busy}
                        className={`cursor-pointer ${action === "flag" ? "" : "bg-red-600 hover:bg-red-700"}`}
                    >
                        {busy && <Loader size={4} color="text-white" />}
                        {action === "flag" ? "Flag" : "Delete"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

type Action = "flag" | "delete" | "photo";

function Option({
    value,
    current,
    onPick,
    title,
    hint,
}: {
    value: Action;
    current: Action;
    onPick: (a: Action) => void;
    title: string;
    hint: string;
}) {
    return (
        <label
            className={`flex cursor-pointer gap-2.5 rounded-lg p-2.5 ring-1 transition ${
                current === value ? "bg-gray-50 ring-black/40" : "ring-black/10 hover:bg-gray-50"
            }`}
        >
            <input type="radio" name="mod-action" checked={current === value} onChange={() => onPick(value)} className="mt-0.5 accent-black" />
            <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-gray-500">{hint}</span>
            </span>
        </label>
    );
}
