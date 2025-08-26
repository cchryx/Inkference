"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Area } from "react-easy-crop";
import Preview from "./Preview";
import { createPost } from "@/actions/content/post/createPost";
import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";
import { useRouter } from "next/navigation";

export type CroppableImage = {
    file: File;
    url: string;
    crop: { x: number; y: number };
    zoom: number;
    aspect: number;
    croppedAreaPixels: Area | null;
    croppedImage?: string;
};

type Props = {
    onCloseModal: () => void;
    currentUserId: string;
};

export default function CreatePostModal({
    onCloseModal,
    currentUserId,
}: Props) {
    const [step, setStep] = useState(0);
    const totalSteps = 3;

    // Step 1
    const [images, setImages] = useState<CroppableImage[]>([]);
    const [croppedPreviews, setCroppedPreviews] = useState<string[]>([]);

    // Step 2
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [locationSelected, setLocationSelected] = useState(false);

    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const getCroppedImg = async (imageSrc: string, crop: Area) => {
        return new Promise<string>((resolve, reject) => {
            const image = new Image();
            image.src = imageSrc;
            image.crossOrigin = "anonymous";

            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = crop.width;
                canvas.height = crop.height;
                const ctx = canvas.getContext("2d");

                if (!ctx) return reject("No 2d context");

                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    crop.width,
                    crop.height
                );

                canvas.toBlob((blob) => {
                    if (!blob) return reject("Canvas is empty");
                    const url = URL.createObjectURL(blob);
                    resolve(url);
                }, "image/jpeg");
            };
            image.onerror = (err) => reject(err);
        });
    };

    const handleNextClick = async () => {
        if (step === 0) {
            if (!images.length) {
                toast.error("Please upload at least one image.");
                return;
            }

            const previews: string[] = [];

            for (const img of images) {
                let cropArea = img.croppedAreaPixels;

                // If no crop area, generate default full-image crop
                if (!cropArea) {
                    const imageObj = await new Promise<HTMLImageElement>(
                        (resolve, reject) => {
                            const image = new Image();
                            image.src = img.url;
                            image.crossOrigin = "anonymous";
                            image.onload = () => resolve(image);
                            image.onerror = (err) => reject(err);
                        }
                    );

                    // Generate crop that fits the image aspect
                    const imgAspect = imageObj.width / imageObj.height;
                    let width = imageObj.width;
                    let height = imageObj.height;

                    if (img.aspect > imgAspect) {
                        // Crop by height
                        height = imageObj.width / img.aspect;
                    } else {
                        // Crop by width
                        width = imageObj.height * img.aspect;
                    }

                    cropArea = {
                        x: (imageObj.width - width) / 2,
                        y: (imageObj.height - height) / 2,
                        width,
                        height,
                    };
                }

                const preview = await getCroppedImg(img.url, cropArea);
                previews.push(preview);
            }

            setCroppedPreviews(previews);
        }

        if (step < totalSteps - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!images.length && !description.trim()) {
            toast.error(
                "Please provide a description or upload at least one image."
            );
            return;
        }

        setIsPending(true);

        try {
            // Convert previews to File objects
            let filesToUpload: File[] = await Promise.all(
                croppedPreviews.map(async (previewUrl, i) => {
                    const response = await fetch(previewUrl);
                    const blob = await response.blob();
                    let file = new File([blob], images[i].file.name, {
                        type: blob.type,
                    });

                    // Convert HEIC to JPEG if needed
                    if (
                        file.type === "image/heic" ||
                        file.name.endsWith(".heic")
                    ) {
                        const heic2any = (await import("heic2any")).default;
                        const jpegBlob: any = await heic2any({
                            blob: file,
                            toType: "image/jpeg",
                            quality: 0.9,
                        });
                        file = new File(
                            [jpegBlob],
                            file.name.replace(/\.heic$/i, ".jpg"),
                            {
                                type: "image/jpeg",
                            }
                        );
                    }

                    return file;
                })
            );

            const uploadResults = await uploadPhotos(
                filesToUpload,
                currentUserId,
                "posts"
            );

            const uploadedUrls = uploadResults
                .filter((r) => r.url)
                .map((r) => r.url!) as string[];

            if (!uploadedUrls.length && !description.trim()) {
                toast.error("No photos uploaded and no description provided.");
                setIsPending(false);
                return;
            }

            // Create post
            const postRes = await createPost({
                type: "post",
                dataId: "",
                content: uploadedUrls,
                description,
                location,
                mentions: [],
                tags: [],
            });

            if (postRes.error) {
                toast.error(postRes.error);
            } else {
                toast.success("Post created successfully.");
                onCloseModal();
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to create post.");
        }

        setIsPending(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl shadow-lg flex flex-col max-h-[95vh] w-[95vw] md:w-[80vw] lg:w-[50vw]">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Create Post</h2>
                    <button
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {step === 0 && (
                        <Step1 images={images} setImages={setImages} />
                    )}

                    {step === 1 && (
                        <Step2
                            description={description}
                            setDescription={setDescription}
                            location={location}
                            setLocation={setLocation}
                            locationSelected={locationSelected}
                            setLocationSelected={setLocationSelected}
                        />
                    )}

                    {step === 2 && (
                        <Preview
                            images={croppedPreviews}
                            description={description}
                            location={location}
                        />
                    )}
                </div>

                {/* Footer Navigation with dots */}
                <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl">
                    <Button
                        onClick={handleBack}
                        disabled={step === 0 || isPending}
                    >
                        Back
                    </Button>

                    <div className="flex gap-2 items-center">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`size-2 rounded-full ${
                                    step === i
                                        ? "bg-black size-3"
                                        : "bg-gray-400"
                                }`}
                            />
                        ))}
                    </div>

                    {step === totalSteps - 1 ? (
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            Post
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleNextClick}
                            disabled={isPending}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
