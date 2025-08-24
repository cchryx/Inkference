"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../../general/Skeleton";
import { ChevronDown, ChevronRight, Pencil, X } from "lucide-react";
import EditGalleryModal from "./edit/EditGalleryModal";
import Modal from "@/components/general/Modal";
import Img from "@/components/general/Img";

type Props = {
    isOwner: boolean;
    projectId: string;
    galleryImages: any;
};

const GalleryCard = ({ isOwner, galleryImages, projectId }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedImage, setSelectedImage] = useState<null | {
        image: string;
        description: string;
    }>(null);
    const [editOpen, setEditOpen] = useState(false);

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
        <>
            <EditGalleryModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                projectId={projectId}
                initialGallery={galleryImages}
            />
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <h2 className="text-lg font-semibold">
                            Project Gallery ({galleryImages.length})
                        </h2>
                        {isOwner && (
                            <button
                                onClick={() => setEditOpen(true)}
                                className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
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
                            maxHeight: "calc((180px + 2rem) * 3)",
                        }}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {galleryImages.map((img: any, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedImage(img)}
                                    className="rounded-md overflow-hidden cursor-pointer bg-gray-300 hover:brightness-90 transition"
                                >
                                    <Img
                                        src={img.image}
                                        fallbackSrc="/assets/general/fillers/merit.png"
                                        alt={`Gallery image ${index + 1}`}
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
                    <Modal open={true} onClose={closeModal}>
                        <div className="max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[70vw] flex flex-col md:flex-row gap-4 justify-center">
                            {/* Image Box */}
                            <div className="bg-gray-300 w-full md:flex-1 overflow-hidden rounded-md shadow-lg flex items-center justify-center p-0 md:p-4">
                                <Img
                                    src={selectedImage.image}
                                    fallbackSrc="/assets/general/fillers/merit.png"
                                    alt="Gallery image"
                                    className="w-full h-full object-contain rounded-md"
                                />
                            </div>

                            {/* Description Box */}
                            <div className="bg-gray-300 w-full md:w-[25%] rounded-md shadow-lg p-4 flex flex-col justify-between gap-4">
                                <div className="flex-1 overflow-y-auto max-h-[70vh] pr-2">
                                    <p className="break-words whitespace-pre-wrap text-xs md:text-base text-gray-800">
                                        {selectedImage.description}
                                    </p>
                                </div>

                                {/* Controls + Close */}
                                <div className="flex justify-end items-center gap-2">
                                    <div className="flex-1 flex gap-2">
                                        {/* Previous Button */}
                                        {galleryImages.indexOf(selectedImage) >
                                            0 && (
                                            <button
                                                onClick={() =>
                                                    setSelectedImage(
                                                        galleryImages[
                                                            galleryImages.indexOf(
                                                                selectedImage
                                                            ) - 1
                                                        ]
                                                    )
                                                }
                                                className="px-3 py-1 cursor-pointer bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 transition text-gray-800"
                                            >
                                                &lt;
                                            </button>
                                        )}
                                        {/* Next Button */}
                                        {galleryImages.indexOf(selectedImage) <
                                            galleryImages.length - 1 && (
                                            <button
                                                onClick={() =>
                                                    setSelectedImage(
                                                        galleryImages[
                                                            galleryImages.indexOf(
                                                                selectedImage
                                                            ) + 1
                                                        ]
                                                    )
                                                }
                                                className="px-3 py-1 cursor-pointer bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 transition text-gray-800"
                                            >
                                                &gt;
                                            </button>
                                        )}
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-600 hover:text-black dark:hover:text-white cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </>
    );
};

export default GalleryCard;
