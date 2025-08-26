"use client";

import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Img from "@/components/general/Img";

type Props = {
    images: string[]; // cropped previews
    description: string;
    location: string;
};

const Preview = ({ images, description, location }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevImage = () => {
        if (images.length === 0) return;
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextImage = () => {
        if (images.length === 0) return;
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-4 text-sm text-gray-800">
            {/* Images */}
            <div className="relative w-full bg-gray-100 rounded flex items-center justify-center overflow-hidden h-[40vh] lg:h-[60vh]">
                {images.length > 0 ? (
                    <>
                        {/* Previous Button */}
                        <button
                            onClick={prevImage}
                            className="absolute left-2 p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Image Container */}
                        <div className="h-full flex items-center justify-center">
                            <Img
                                src={images[currentIndex]}
                                alt={`Preview ${currentIndex + 1}`}
                                className="h-full object-contain rounded"
                            />
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={nextImage}
                            className="absolute right-2 p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-center w-full h-[60vh] bg-gray-100 rounded-lg text-gray-500 text-lg font-medium">
                        No images uploaded
                    </div>
                )}
            </div>

            {/* Dots for images */}
            <div className="flex gap-2 justify-center">
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                            i === currentIndex ? "bg-black" : "bg-gray-400"
                        }`}
                    />
                ))}
            </div>

            {/* Description */}
            <div>
                <Label className="font-semibold">Description:</Label>
                <div className="break-words">
                    {description || "[No Description Provided]"}
                </div>
            </div>

            {/* Location */}
            <div>
                <span className="font-semibold">Location:</span>{" "}
                {location || "[No Location Provided]"}
            </div>
        </div>
    );
};

export default Preview;
