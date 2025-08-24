"use client";

import Img from "@/components/general/Img";
import Link from "next/link";

type Photo = {
    id: string;
    image?: string;
};

type Gallery = {
    id: string;
    name: string;
    photos: Photo[];
    updatedAt: string;
};

type Props = {
    gallery: Gallery;
};

export default function GalleryCard({ gallery }: Props) {
    const topPhotos = gallery.photos.slice(0, 4); // Select top 4 photos.

    const displayItems = [...topPhotos];
    while (displayItems.length < 4) {
        displayItems.push({
            id: `placeholder-${displayItems.length}`,
            image: undefined,
        });
    }

    return (
        <Link href={`/gallery/${gallery.id}`} className="block">
            <div className="flex cursor-pointer bg-gray-100 rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.02] duration-300 overflow-hidden p-3 gap-3 items-center">
                {/* Left collage. */}
                <div className="grid grid-cols-2 grid-rows-2 gap-1 w-20 h-20">
                    {displayItems.map((photo) => (
                        <div
                            key={photo.id}
                            className={`rounded-sm overflow-hidden relative w-full h-full aspect-square ${
                                photo.image ? "" : "bg-gray-300 animate-pulse"
                            }`}
                        >
                            {photo.image && (
                                <Img
                                    src={photo.image}
                                    fallbackSrc="/assets/general/fillers/skill.png"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Gallery info. */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                        {gallery.name}
                    </h3>
                    <span className="text-sm text-gray-500 mt-1 truncate">
                        {gallery.photos.length > 0
                            ? `${gallery.photos.length} Photo${
                                  gallery.photos.length !== 1 ? "s" : ""
                              }`
                            : "Empty"}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5 truncate">
                        Updated{" "}
                        {new Date(gallery.updatedAt).toLocaleDateString(
                            undefined,
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }
                        )}
                    </span>
                </div>
            </div>
        </Link>
    );
}
