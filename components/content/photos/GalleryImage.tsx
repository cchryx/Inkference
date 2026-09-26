"use client";

import { useState } from "react";
import { MoreVertical, ShieldAlert, Trash2 } from "lucide-react";
import Img from "@/components/general/Img";
import { previewUrl } from "@/lib/imageUrl";

type Props = {
    photo: { id: string; image: string };
    isOwner?: boolean;
    /** Open the full-screen viewer on this photo. */
    onOpen: () => void;
    onDelete: () => void;
    /** Admins (not the owner): flag or delete this photo. */
    onModerate?: () => void;
};

/** One photo in the gallery grid. Tap it to open the viewer. */
const GalleryImage = ({ photo, isOwner = false, onOpen, onDelete, onModerate }: Props) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div
            className="relative group masonry-item rounded-lg overflow-hidden bg-gray-200 cursor-zoom-in"
            onMouseLeave={() => setMenuOpen(false)}
            onClick={onOpen}
        >
            {photo.image && (
                <Img
                    src={previewUrl(photo.image, 640)}
                    placeholderClassName="aspect-[4/5]"
                    fallbackSrc="/assets/general/fillers/skill.png"
                    alt="Gallery image"
                    className="w-full h-full object-cover rounded-lg"
                />
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none" />

            {onModerate && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onModerate();
                    }}
                    aria-label="Moderate photo (admin)"
                    title="Moderate (admin)"
                    className="hidden sm:flex absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                    <ShieldAlert size={18} />
                </button>
            )}

            {/* Owner menu (computers; on phones delete from the viewer) */}
            {isOwner && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        aria-label="Photo options"
                        className="hidden sm:flex absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {menuOpen && (
                        <div className="hidden sm:block absolute top-11 right-2 z-20 rounded-lg bg-white p-1 text-sm shadow-lg ring-1 ring-black/10">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete();
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                                <Trash2 size={16} /> Remove
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GalleryImage;
