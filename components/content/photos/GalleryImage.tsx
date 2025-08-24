"use client";

import { useState } from "react";
import Img from "@/components/general/Img";
import Modal from "@/components/general/Modal";
import ConfirmModal from "@/components/general/ConfirmModal";
import { MoreVertical, Trash2, Eye } from "lucide-react";
import { deletePhoto } from "@/actions/content/photos/deletePhoto";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GalleryImage = ({ photo, isOwner = false }: any) => {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmMOpen, setConfirmMOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleDeletePhoto = async () => {
        setIsPending(true);
        const { error } = await deletePhoto(photo.id);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Photo deleted successfully.");
            router.refresh();
        }
        setIsPending(false);
    };

    return (
        <>
            <div
                key={photo.id}
                className="relative group masonry-item rounded-lg overflow-hidden bg-gray-200"
                onMouseLeave={() => setMenuOpen(false)}
                onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
            >
                {photo.image && (
                    <Img
                        src={photo.image}
                        fallbackSrc="/assets/general/fillers/skill.png"
                        alt="Gallery image"
                        className="w-full h-auto object-cover rounded-lg"
                    />
                )}

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity sm:block hidden" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="hidden sm:flex absolute cursor-pointer top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                >
                    <MoreVertical size={18} />
                </button>

                {menuOpen && (
                    <div className="hidden sm:block absolute top-11 right-2 bg-black/70 text-white shadow-md rounded-md py-2 px-3 z-20 space-y-2">
                        {isOwner && (
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirmMOpen(true);
                                }}
                                className="flex cursor-pointer items-center gap-2 text-red-400 hover:text-red-300"
                            >
                                <Trash2 size={16} />
                                Remove
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                setViewModalOpen(true);
                            }}
                            className="flex cursor-pointer items-center gap-2 text-white hover:text-gray-300"
                        >
                            <Eye size={16} />
                            View
                        </button>
                    </div>
                )}

                {mobileActionsOpen && (
                    <div className="sm:hidden absolute bottom-2 right-2 gap-2 flex z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewModalOpen(true);
                                setMobileActionsOpen(false);
                            }}
                            className="bg-black/60 text-white px-3 py-1 rounded-md flex items-center gap-1"
                        >
                            <Eye size={14} />
                            View
                        </button>
                        {isOwner && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmMOpen(true);
                                    setMobileActionsOpen(false);
                                }}
                                className="bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isPending={isPending}
                open={confirmMOpen}
                title="Delete this photo?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeletePhoto();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />

            <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
                <div className="bg-black rounded-lg shadow-lg max-w-3xl max-h-[90vh] overflow-hidden">
                    {photo.image && (
                        <img
                            src={photo.image}
                            alt="Full view"
                            className="w-[95vw] h-auto max-h-[90vh] object-contain"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default GalleryImage;
