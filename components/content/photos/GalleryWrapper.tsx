"use client";

import { useState, useEffect, useRef } from "react";
import GalleryImage from "./GalleryImage";

interface GalleryWrapperProps {
    photos: any[];
    galleryImages: any[];
    isOwner: boolean;
}

// How many photos to show at first, and how many more each time the user
// scrolls near the bottom.
const PAGE_SIZE = 20;

export const GalleryWrapper = ({
    photos,
    galleryImages,
    isOwner,
}: GalleryWrapperProps) => {
    const [columns, setColumns] = useState(5);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

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

    // When the invisible marker under the grid gets close to the screen,
    // show the next batch of photos.
    const hasMore = visibleCount < photos.length;
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount((n) => Math.min(n + PAGE_SIZE, photos.length));
                }
            },
            { rootMargin: "600px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, photos.length, visibleCount]);

    // Distribute the visible photos into columns. Keeping the original index
    // means photos never move between columns when more are added.
    const distributedPhotos: { photo: any; index: number }[][] = Array.from(
        { length: columns },
        () => []
    );
    photos.slice(0, visibleCount).forEach((photo, index) => {
        distributedPhotos[index % columns].push({ photo, index });
    });

    return (
        <>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {distributedPhotos.map((columnPhotos, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-4">
                        {columnPhotos.map(({ photo, index }) => (
                            <GalleryImage
                                key={photo.id}
                                photo={photo}
                                galleryImages={galleryImages}
                                currentIndex={index}
                                isOwner={isOwner}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Invisible marker: loads the next batch when scrolled near */}
            {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
        </>
    );
};
