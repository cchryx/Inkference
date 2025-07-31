"use client";

import React, { useMemo, useState } from "react";
import { ImageIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { editProject } from "@/actions/content/project/editProject";
import { useRouter } from "next/navigation";

import Modal from "@/components/general/Modal";
import { Label } from "@radix-ui/react-label";
import Loader from "@/components/general/Loader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InfoTooltip from "@/components/general/InfoToolTip";

type GalleryItem = {
    image: string;
    description: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    projectId: string;
    initialGallery: GalleryItem[];
};

const MAX_GALLERY = 100;
const MAX_DESC_CHARS = 500;

const EditGalleryModal = ({
    open,
    onClose,
    projectId,
    initialGallery,
}: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery || []);
    const [showInput, setShowInput] = useState(false);

    const [imageUrl, setImageUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isImageValid, setIsImageValid] = useState(true);

    const canAddMore = gallery.length < MAX_GALLERY;
    const canAdd =
        !!imageUrl.trim() &&
        !!description.trim() &&
        canAddMore &&
        description.trim().length <= MAX_DESC_CHARS &&
        isImageValid;

    const handleAdd = () => {
        if (!canAdd) return;
        const next: GalleryItem = {
            image: imageUrl.trim(),
            description: description.trim(),
        };
        setGallery((prev) => [next, ...prev]);
        setImageUrl("");
        setDescription("");
        setShowInput(false);
    };

    const handleRemove = (index: number) => {
        setGallery((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsPending(true);

        const { error } = await editProject(projectId, {
            galleryImages: gallery,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success("Project gallery updated successfully.");
            router.refresh();
            onClose();
        }

        setIsPending(false);
    };

    const showPreview = useMemo(() => imageUrl.trim().length > 0, [imageUrl]);

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Edit Project Gallery</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Add / Toggle input */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {gallery.length}/{MAX_GALLERY} items
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowInput((prev) => !prev)}
                            className="w-fit text-xs px-2 py-1 h-auto mt-1 cursor-pointer"
                            disabled={!canAddMore && !showInput}
                        >
                            {showInput ? "Cancel" : "+ Add Image"}
                        </Button>
                    </div>

                    {/* Input area */}
                    {showInput && (
                        <div className="border rounded-xl p-4 space-y-4">
                            {/* Image URL */}
                            <div className="space-y-2">
                                <Label htmlFor="image">Image URL</Label>
                                <InfoTooltip text="The URL of the gallery image you want to add." />
                                <Input
                                    value={imageUrl}
                                    onChange={(e) => {
                                        setImageUrl(e.target.value);
                                        setIsImageValid(true); // reset on input
                                    }}
                                    placeholder="https://example.com/image.jpg"
                                    className="flex-1"
                                />
                            </div>

                            {/* Preview */}
                            <div className="border rounded-lg p-2 flex items-center justify-center h-100 bg-gray-700">
                                {showPreview ? (
                                    <img
                                        src={imageUrl}
                                        className="h-full w-full object-contain rounded"
                                        onError={() => {
                                            setIsImageValid(false);
                                            setImageUrl("");
                                        }}
                                        onLoad={() => setIsImageValid(true)}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-white">
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-sm">
                                            Image preview
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <InfoTooltip text="A detailed description of your gallery image. (max 800 chars, 5 lines)" />
                                </div>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Start typing description..."
                                    value={description}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const lines = val.split("\n").length;
                                        if (
                                            lines <= 5 &&
                                            val.length <= MAX_DESC_CHARS
                                        ) {
                                            setDescription(val);
                                        }
                                    }}
                                    className="resize-none max-h-[300px] overflow-y-auto"
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        {MAX_DESC_CHARS - description.length}{" "}
                                        characters left
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={handleAdd}
                                        disabled={!canAdd}
                                        className="cursor-pointer"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {gallery.length === 0 ? (
                            <div className="text-sm text-gray-500 border rounded-xl p-4">
                                No gallery items yet. Click <b>Add Image</b> to
                                get started.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {gallery.map((item, i) => (
                                    <li
                                        key={`${item.image}-${i}`}
                                        className="flex items-center justify-between gap-3 border rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Thumb */}
                                            <div className="w-9 h-9 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={
                                                        item.description ||
                                                        "Gallery image"
                                                    }
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (
                                                            e.currentTarget as HTMLImageElement
                                                        ).style.display =
                                                            "none";
                                                    }}
                                                />
                                            </div>

                                            {/* One-line text */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {item.description ||
                                                        "Untitled"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.image}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemove(i)}
                                            className="p-2 text-gray-600 hover:text-red-600 rounded-lg cursor-pointer"
                                            aria-label="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

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
                        disabled={isPending}
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
