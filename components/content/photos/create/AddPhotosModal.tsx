"use client";

import { useState, DragEvent } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Img from "@/components/general/Img";
import InfoTooltip from "@/components/general/InfoToolTip";
import { Label } from "@radix-ui/react-label";
import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";
import { createGallery } from "@/actions/content/photos/createGallery";
import { useRouter } from "next/navigation";

type Props = {
    onCloseModal: () => void;
    currentUserId: string;
};

const MAX_SIZE_MB = 5;
const MAX_IMAGES = 100;

export default function AddPhotosModal({ onCloseModal, currentUserId }: Props) {
    const router = useRouter();
    const [photos, setPhotos] = useState<File[]>([]);
    const [galleryName, setGalleryName] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const imagesLeft = MAX_IMAGES - photos.length;

    const addFiles = (files: File[]) => {
        let skipped = 0;
        const validImages = files.filter((file) => {
            const isImage = file.type.startsWith("image/");
            const isWithinLimit = file.size <= MAX_SIZE_MB * 1024 * 1024;
            if (!isImage || !isWithinLimit) {
                skipped++;
                return false;
            }
            return true;
        });

        setPhotos((prev) => {
            const availableSlots = MAX_IMAGES - prev.length;
            const accepted = validImages.slice(0, availableSlots);
            if (skipped > 0 || validImages.length > accepted.length) {
                const overLimit = validImages.length - accepted.length;
                const totalSkipped = skipped + (overLimit > 0 ? overLimit : 0);
                toast.error(
                    `${totalSkipped} image(s) were not added (max ${MAX_IMAGES} images, ≤ ${MAX_SIZE_MB}MB each).`
                );
            }
            return [...prev, ...accepted];
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addFiles(Array.from(e.target.files));
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!galleryName.trim()) {
            toast.error("Please enter a gallery name.");
            return;
        }
        if (photos.length === 0) {
            toast.error("Please upload at least one photo.");
            return;
        }

        setIsPending(true);

        try {
            // Upload photos
            const results = await uploadPhotos(photos, currentUserId);

            const failed = results.filter((r) => r.error);
            if (failed.length > 0) {
                toast.error(`${failed.length} photo(s) failed to upload.`);
            }

            const uploadedUrls = results
                .filter((r) => r.url)
                .map((r) => r.url!) as string[];

            if (uploadedUrls.length === 0) {
                toast.error("No photos were uploaded, cannot create gallery.");
                return;
            }

            // Create gallery
            const galleryRes = await createGallery({
                name: galleryName,
                photos: uploadedUrls,
            });

            if ("error" in galleryRes && galleryRes.error) {
                toast.error("Failed to create gallery.");
                return;
            }

            toast.success("Gallery created successfully!");
            onCloseModal();
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload photos or create gallery.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl shadow-lg flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw]">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Add Photos</h2>
                    <button
                        disabled={isPending}
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Gallery Name */}
                    <div className="flex flex-col w-full gap-1">
                        <div className="flex items-center gap-1">
                            <Label>Gallery Name</Label>
                            <InfoTooltip text="Enter the name of the gallery (max 60 chars)" />
                        </div>
                        <Input
                            placeholder="Enter a gallery name..."
                            value={galleryName}
                            disabled={isPending}
                            onChange={(e) =>
                                setGalleryName(e.target.value.slice(0, 60))
                            }
                        />
                        <span className="text-xs text-gray-500">
                            {60 - galleryName.length} characters left
                        </span>
                    </div>

                    {/* Drag & Drop + Preview Grid */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                            isDragging
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-400 hover:bg-gray-200"
                        }`}
                    >
                        <label
                            htmlFor="photos"
                            className={`flex items-center gap-2 cursor-pointer bg-gray-200 py-1 px-2 rounded-md ${
                                imagesLeft === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            Add Photos (Click or Drag & Drop)
                        </label>
                        <input
                            id="photos"
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={imagesLeft === 0 || isPending}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Only images, up to {MAX_SIZE_MB}MB each.{" "}
                            {imagesLeft} images left.
                        </p>
                    </div>

                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                            {photos.map((photo, index) => {
                                const sizeInMB = (
                                    photo.size /
                                    (1024 * 1024)
                                ).toFixed(2);
                                return (
                                    <div
                                        key={index}
                                        className="relative group border rounded-md overflow-hidden"
                                    >
                                        <Img
                                            src={URL.createObjectURL(photo)}
                                            fallbackSrc="/assets/general/fillers/skill.png"
                                            className="object-cover w-full h-24"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-xs font-medium">
                                            {sizeInMB} MB
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            className="absolute cursor-pointer top-1 right-1 bg-black/60 text-white rounded-full p-1"
                                            onClick={() =>
                                                handleRemovePhoto(index)
                                            }
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl">
                    <Button
                        onClick={handleUpload}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        {isPending ? "Uploading..." : "Upload"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
