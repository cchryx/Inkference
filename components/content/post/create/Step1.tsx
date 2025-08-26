"use client";

import { useState, useRef, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, ZoomIn, Layers2, Maximize } from "lucide-react";
import type { CroppableImage } from "./CreatePostModal";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Props = {
    images: CroppableImage[];
    setImages: React.Dispatch<React.SetStateAction<CroppableImage[]>>;
};

type BottomPanel = "none" | "scale" | "thumbnails" | "aspect";

export default function Step1({ images, setImages }: Props) {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [bottomPanel, setBottomPanel] = useState<BottomPanel>("thumbnails");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_IMAGES = 20;

    const ASPECTS: { label: string; value: number }[] = [
        { label: "1:1", value: 1 },
        { label: "16:9", value: 16 / 9 },
        { label: "4:5", value: 4 / 5 },
    ];

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const fileArray = Array.from(files);

        if (images.length >= MAX_IMAGES) {
            alert(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        const allowedFiles = fileArray.slice(0, MAX_IMAGES - images.length);

        const newImages: CroppableImage[] = allowedFiles.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            crop: { x: 0, y: 0 },
            zoom: 1,
            aspect: 1,
            croppedAreaPixels: null,
        }));

        setImages((prev) => [...prev, ...newImages]);
        if (newImages.length) setActiveIndex(images.length);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const onCropComplete = useCallback(
        (_: Area, croppedArea: Area) => {
            setImages((prev) => {
                const copy = [...prev];
                copy[activeIndex].croppedAreaPixels = croppedArea;
                return copy;
            });
        },
        [activeIndex, setImages]
    );

    const updateImageField = (
        field: "crop" | "zoom" | "aspect",
        value: any
    ) => {
        setImages((prev) => {
            const copy = [...prev];
            copy[activeIndex][field] = value;
            return copy;
        });
    };

    const activeImage = images[activeIndex];

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {activeImage ? (
                <div className="relative w-full max-w-[580px] aspect-square rounded-lg overflow-hidden bg-gray-50">
                    <Cropper
                        image={activeImage.url}
                        crop={activeImage.crop}
                        zoom={activeImage.zoom}
                        aspect={activeImage.aspect}
                        onCropChange={(crop) => updateImageField("crop", crop)}
                        onZoomChange={(zoom) => updateImageField("zoom", zoom)}
                        onCropComplete={onCropComplete}
                    />

                    <button
                        type="button"
                        onClick={() => {
                            const copy = [...images];
                            copy.splice(activeIndex, 1);
                            setImages(copy);
                            setActiveIndex((prev) => Math.max(0, prev - 1));
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                    >
                        <X className="w-4 h-4 text-black" />
                    </button>

                    {bottomPanel !== "none" && (
                        <div className="absolute bottom-0 left-0 w-full bg-white/60 backdrop-blur-md px-2 py-2 rounded-b-lg flex flex-col gap-2">
                            {bottomPanel === "scale" && (
                                <div className="flex items-center gap-2 px-1">
                                    <ZoomIn className="size-6 text-gray-700" />
                                    <Slider
                                        value={[activeImage.zoom]}
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        onValueChange={([val]) =>
                                            updateImageField("zoom", val)
                                        }
                                        className="flex-1"
                                    />
                                </div>
                            )}

                            {bottomPanel === "aspect" && (
                                <div className="flex gap-2 justify-center">
                                    {ASPECTS.map((a) => (
                                        <Button
                                            type="button"
                                            key={a.label}
                                            size="sm"
                                            variant={
                                                activeImage.aspect === a.value
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                updateImageField(
                                                    "aspect",
                                                    a.value
                                                )
                                            }
                                        >
                                            {a.label}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {bottomPanel === "thumbnails" &&
                                images.length > 0 && (
                                    <div className="overflow-x-auto w-full">
                                        <div className="flex gap-2 flex-nowrap w-max mb-1">
                                            {images.map((img, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                                        i === activeIndex
                                                            ? "border-blue-500"
                                                            : "border-black"
                                                    }`}
                                                    onClick={() =>
                                                        setActiveIndex(i)
                                                    }
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt={`img-${i}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}

                                            {images.length < MAX_IMAGES && (
                                                <label
                                                    className="w-16 h-16 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-black rounded-lg cursor-pointer"
                                                    onClick={handleUploadClick}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) =>
                                                            handleFiles(
                                                                e.target.files
                                                            )
                                                        }
                                                        className="hidden"
                                                    />
                                                    <span className="text-black text-lg">
                                                        +
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="relative w-full max-w-[500px] aspect-square border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={handleUploadClick}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                    />
                    <span className="text-gray-600 text-lg text-center p-6">
                        Drag & drop images here or click to upload. (Max{" "}
                        {MAX_IMAGES} images)
                    </span>
                </div>
            )}

            {activeImage && (
                <div className="flex gap-3 items-center">
                    <Button
                        type="button"
                        onClick={() =>
                            setBottomPanel((prev) =>
                                prev === "scale" ? "none" : "scale"
                            )
                        }
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>

                    <Button
                        type="button"
                        onClick={() =>
                            setBottomPanel((prev) =>
                                prev === "aspect" ? "none" : "aspect"
                            )
                        }
                    >
                        <Maximize className="w-4 h-4" />
                        {activeImage.aspect === 1
                            ? "1:1"
                            : activeImage.aspect === 16 / 9
                            ? "16:9"
                            : "4:5"}
                    </Button>

                    <Button
                        type="button"
                        onClick={() =>
                            setBottomPanel((prev) =>
                                prev === "thumbnails" ? "none" : "thumbnails"
                            )
                        }
                    >
                        <Layers2 className="w-4 h-4" />
                        <span className="ml-1 text-sm">
                            {images.length} / {MAX_IMAGES}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
}
