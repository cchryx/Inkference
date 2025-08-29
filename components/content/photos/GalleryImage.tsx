"use client";

import { useState } from "react";
import Img from "@/components/general/Img";
import Modal from "@/components/general/Modal";
import ConfirmModal from "@/components/general/ConfirmModal";
import { MoreVertical, Trash2, Eye } from "lucide-react";
import { deletePhoto } from "@/actions/content/photos/deletePhoto";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GalleryImage = ({
    photo,
    isOwner = false,
    galleryImages,
    currentIndex,
}: any) => {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmMOpen, setConfirmMOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(currentIndex);

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

    const prevImage = () =>
        selectedIndex > 0 && setSelectedIndex(selectedIndex - 1);
    const nextImage = () =>
        selectedIndex < galleryImages.length - 1 &&
        setSelectedIndex(selectedIndex + 1);

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
                        className="w-full h-full object-cover rounded-lg"
                    />
                )}

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity sm:block hidden" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="hidden sm:flex absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
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
                                className="flex items-center gap-2 text-red-400 hover:text-red-300"
                            >
                                <Trash2 size={16} />
                                Remove
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                setSelectedIndex(currentIndex);
                                setViewModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-white hover:text-gray-300"
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
                                setSelectedIndex(currentIndex);
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
                <div className="relative rounded-lg flex items-center justify-center max-h-[90vh] w-full overflow-hidden group">
                    {/* Previous Button (Desktop Only) */}
                    {selectedIndex > 0 && (
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 px-3 py-2 rounded opacity-0 sm:group-hover:opacity-100 transition hidden sm:block"
                        >
                            &lt;
                        </button>
                    )}

                    {/* Next Button (Desktop Only) */}
                    {selectedIndex < galleryImages.length - 1 && (
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 px-3 py-2 rounded opacity-0 sm:group-hover:opacity-100 transition hidden sm:block"
                        >
                            &gt;
                        </button>
                    )}

                    {/* Mobile Transparent Overlays */}
                    {selectedIndex > 0 && (
                        <div
                            onClick={prevImage}
                            className="sm:hidden absolute left-0 top-0 h-full w-1/2 z-10"
                        />
                    )}
                    {selectedIndex < galleryImages.length - 1 && (
                        <div
                            onClick={nextImage}
                            className="sm:hidden absolute right-0 top-0 h-full w-1/2 z-10"
                        />
                    )}

                    {galleryImages[selectedIndex]?.image && (
                        <Img
                            src={galleryImages[selectedIndex].image}
                            className="lg:h-[80vh] w-[95vw] h-auto lg:w-auto object-contain"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default GalleryImage;
