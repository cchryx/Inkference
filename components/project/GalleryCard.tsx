"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { ChevronDown, ChevronRight, X } from "lucide-react";

const galleryImages = Array.from({ length: 10 }).map((_, i) => ({
    url: `https://picsum.photos/seed/gallery${i}/400/300`,
    description: `Sample description for image ${i + 1}`,
}));

const GalleryCard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedImage, setSelectedImage] = useState<null | {
        url: string;
        description: string;
    }>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleMinimize = () => setIsMinimized((prev) => !prev);
    const closeModal = () => setSelectedImage(null);

    if (isLoading) {
        return (
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-[30%] h-6 rounded-md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="w-full h-[180px] rounded-md" />
                            <Skeleton className="w-[80%] h-3 rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Project Gallery ({galleryImages.length})
                </h2>
                <button
                    onClick={toggleMinimize}
                    className="text-gray-600 hover:text-black transition cursor-pointer"
                >
                    {isMinimized ? (
                        <ChevronRight className="size-6" />
                    ) : (
                        <ChevronDown className="size-6" />
                    )}
                </button>
            </div>

            {!isMinimized && (
                <div
                    className="overflow-y-auto pr-1 yes-scrollbar"
                    style={{
                        maxHeight: "calc((180px + 2rem) * 3)", // 3 rows of image + spacing
                    }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {galleryImages.map((img, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedImage(img)}
                                className="rounded-md overflow-hidden cursor-pointer bg-gray-300 hover:brightness-90 transition"
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-[240px] object-cover"
                                />
                                <div className="text-xs p-2 text-gray-800 truncate">
                                    {img.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-gray-200 rounded-md shadow-lg w-full max-w-4xl relative flex flex-col md:flex-row overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image section */}
                        <img
                            src={selectedImage.url}
                            alt=""
                            className="w-full md:w-2/3 h-auto object-contain max-h-[70vh]"
                        />

                        {/* Description + Close button */}
                        <div className="p-4 text-sm text-gray-800 w-full md:w-1/3 flex flex-col justify-between gap-4">
                            <p className="flex-1">
                                {selectedImage.description}
                            </p>
                            <button
                                onClick={closeModal}
                                className="self-end text-gray-600 hover:text-black cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryCard;
