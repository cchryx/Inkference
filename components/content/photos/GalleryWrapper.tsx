"use client";

import { useState, useEffect } from "react";
import GalleryImage from "./GalleryImage"; // adjust path if needed

interface GalleryWrapperProps {
    photos: any[];
    galleryImages: any[];
    isOwner: boolean;
}

export const GalleryWrapper = ({
    photos,
    galleryImages,
    isOwner,
}: GalleryWrapperProps) => {
    const [columns, setColumns] = useState(5);

    // Update columns based on screen size
    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1024) setColumns(5); // lg
            else if (window.innerWidth >= 768) setColumns(4); // md
            else setColumns(2); // sm
        };

        updateColumns();
        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, []);

    // Distribute photos into columns
    const distributedPhotos: (typeof photos)[][] = Array.from(
        { length: columns },
        () => []
    );
    photos.forEach((photo, i) => {
        distributedPhotos[i % columns].push(photo);
    });

    return (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {distributedPhotos.map((columnPhotos, colIndex) => (
                <div key={colIndex} className="grid gap-4">
                    {columnPhotos.map((photo: any) => (
                        <GalleryImage
                            key={photo.id}
                            photo={photo}
                            galleryImages={galleryImages}
                            currentIndex={galleryImages.indexOf(photo)}
                            isOwner={isOwner}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};
