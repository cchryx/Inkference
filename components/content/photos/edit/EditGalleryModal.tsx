"use client";

import { useState } from "react";
import { ImageIcon, Trash2, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@radix-ui/react-label";

import Modal from "@/components/general/Modal";
import Loader from "@/components/general/Loader";
import InfoTooltip from "@/components/general/InfoToolTip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { editGallery } from "@/actions/content/photos/editGallery";
import { previewUrl } from "@/lib/imageUrl";

const MAX_NAME_CHARS = 100;

type Photo = {
    id: string;
    image?: string | null;
    createdAt?: string | Date;
};

type Props = {
    onClose: () => void;
    galleryId: string;
    initialName: string;
    photos: Photo[];
};

/**
 * Rename a gallery and remove photos. Same layout as the project
 * EditGalleryModal. Nothing is changed until "Save Changes".
 */
const EditGalleryModal = ({ onClose, galleryId, initialName, photos }: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [name, setName] = useState(initialName);
    const [removed, setRemoved] = useState<Set<string>>(new Set());

    const trimmedName = name.trim();
    const hasChanges = trimmedName !== initialName.trim() || removed.size > 0;
    const canSave =
        hasChanges && !!trimmedName && trimmedName.length <= MAX_NAME_CHARS;
    const remaining = photos.length - removed.size;

    const toggleRemove = (id: string) => {
        setRemoved((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!canSave) return;
        setIsPending(true);

        const { error } = await editGallery(galleryId, {
            name: trimmedName,
            removePhotoIds: [...removed],
        });

        setIsPending(false);

        if (error) {
            toast.error(error);
            return;
        }

        toast.success("Gallery updated successfully.");
        router.refresh();
        onClose();
    };

    return (
        <Modal open={true} onClose={isPending ? () => {} : onClose}>
            <div className="flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw] bg-gray-100 rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Edit Gallery</h2>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Name */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1">
                            <Label htmlFor="galleryName">Gallery Name</Label>
                            <InfoTooltip
                                text={`The name shown on your gallery. (max ${MAX_NAME_CHARS} chars)`}
                            />
                        </div>
                        <Input
                            id="galleryName"
                            value={name}
                            maxLength={MAX_NAME_CHARS}
                            disabled={isPending}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My gallery"
                        />
                        <span className="text-xs text-gray-500">
                            {MAX_NAME_CHARS - name.length} characters left
                        </span>
                    </div>

                    {/* Photos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Photos</Label>
                            <div className="text-sm text-gray-600">
                                {remaining} photo{remaining !== 1 ? "s" : ""}
                            </div>
                        </div>

                        {removed.size > 0 && (
                            <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
                                {removed.size} photo
                                {removed.size !== 1 ? "s" : ""} will be
                                permanently deleted when you save.
                            </div>
                        )}

                        {photos.length === 0 ? (
                            <div className="text-sm text-gray-500 border rounded-xl p-4">
                                This gallery has no photos yet. Use{" "}
                                <b>Upload Photos</b> to add some.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {photos.map((photo, i) => {
                                    const isRemoved = removed.has(photo.id);

                                    return (
                                        <li
                                            key={photo.id}
                                            className={`flex items-center justify-between gap-3 border rounded-xl px-3 py-2 transition ${
                                                isRemoved
                                                    ? "opacity-50 border-red-300 bg-red-50"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Thumb */}
                                                <div className="w-12 h-12 rounded-md bg-gray-300 overflow-hidden flex items-center justify-center shrink-0">
                                                    {photo.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={previewUrl(photo.image, 120)}
                                                            alt={`Photo ${i + 1}`}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p
                                                        className={`text-sm font-medium truncate ${
                                                            isRemoved
                                                                ? "line-through"
                                                                : ""
                                                        }`}
                                                    >
                                                        Photo {i + 1}
                                                    </p>
                                                    {photo.createdAt && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            Added{" "}
                                                            {new Date(
                                                                photo.createdAt
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                }
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleRemove(photo.id)
                                                }
                                                disabled={isPending}
                                                className={`p-2 rounded-lg cursor-pointer ${
                                                    isRemoved
                                                        ? "text-gray-700 hover:text-black"
                                                        : "text-gray-600 hover:text-red-600"
                                                }`}
                                                aria-label={
                                                    isRemoved ? "Undo remove" : "Remove"
                                                }
                                                title={
                                                    isRemoved ? "Undo remove" : "Remove"
                                                }
                                            >
                                                {isRemoved ? (
                                                    <Undo2 className="w-4 h-4" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="cursor-pointer"
                        disabled={isPending || !canSave}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditGalleryModal;
