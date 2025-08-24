"use client";

import React, { useState } from "react";
import Img from "@/components/general/Img";
import { Pencil, Trash2, UploadIcon } from "lucide-react";
import ConfirmModal from "@/components/general/ConfirmModal";
import { deleteGallery } from "@/actions/content/photos/deleteGallery";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddGalleryPhotosModal from "./edit/AddGalleryPhotosModal";

type Photo = {
    id: string;
    image?: string;
};

type Props = {
    galleryId: string;
    galleryName: string;
    topPhotos: Photo[];
    isOwner: boolean;
};

const HeaderCard = ({ galleryId, galleryName, topPhotos, isOwner }: Props) => {
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [addPhotosOpen, setAddPhotosOpen] = useState(false); // modal state
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleDeleteGallery = async () => {
        setIsPending(true);
        const { error } = await deleteGallery(galleryId);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Gallery deleted successfully.");
            router.refresh();
            router.push("/portfolio?section=photos");
        }

        setIsPending(false);
    };

    return (
        <>
            {/* Confirm Delete Modal */}
            <ConfirmModal
                isPending={isPending}
                open={confirmDeleteOpen}
                title="Delete this gallery?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteGallery();
                    setConfirmDeleteOpen(false);
                }}
                onClose={() => setConfirmDeleteOpen(false)}
            />

            {/* Add Photos Modal */}
            {addPhotosOpen && (
                <AddGalleryPhotosModal
                    onCloseModal={() => setAddPhotosOpen(false)}
                    currentUserId={""} // replace with actual userId from session/context
                    galleryId={galleryId} // pass galleryId to modal
                />
            )}

            <div className="bg-gray-200 shadow-md rounded-xl p-6 flex flex-col md:flex-row gap-4 flex-1 justify-between">
                {/* Left: Collage and Gallery Name */}
                <div className="flex flex-1 gap-5 min-w-0">
                    {/* Collage Preview (first 4 images) */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 size-25 flex-shrink-0">
                        {[0, 1, 2, 3].map((i) => {
                            const photo = topPhotos[i];
                            return (
                                <div
                                    key={i}
                                    className={`rounded-sm overflow-hidden relative w-full h-full aspect-square ${
                                        !photo?.image ? "bg-gray-400" : ""
                                    }`}
                                >
                                    {photo?.image && (
                                        <Img
                                            src={photo.image}
                                            fallbackSrc="/assets/general/fillers/skill.png"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Gallery Name */}
                    <h1 className="text-2xl font-bold truncate">
                        {galleryName}
                    </h1>
                </div>

                {/* Right: Action Buttons (Owner only) */}
                {isOwner && (
                    <div className="flex lg:flex-col gap-2 flex-wrap lg:items-end justify-center lg:justify-start">
                        <button
                            onClick={() => setAddPhotosOpen(true)}
                            className="flex items-center w-fit h-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                        >
                            <UploadIcon className="w-4 h-4" /> Upload Photos
                        </button>

                        <div className="flex gap-2">
                            <button className="flex items-center w-fit h-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer">
                                <Pencil className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setConfirmDeleteOpen(true)}
                                className="flex items-center w-fit h-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default HeaderCard;
