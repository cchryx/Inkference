"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GalleryImage from "./GalleryImage";
import PhotoViewer from "./PhotoViewer";
import ConfirmModal from "@/components/general/ConfirmModal";
import { deletePhoto } from "@/actions/content/photos/deletePhoto";
import { useIsAdmin } from "@/components/admin/useIsAdmin";
import ModerateModal from "@/components/admin/ModerateModal";

type Photo = { id: string; image: string };

interface GalleryWrapperProps {
    photos: Photo[];
    galleryImages: Photo[];
    isOwner: boolean;
    /** File size of each photo by link (owner only). */
    sizes?: Record<string, number>;
}

// How many photos to show at first, and how many more each time the user
// scrolls near the bottom.
const PAGE_SIZE = 20;

export const GalleryWrapper = ({ photos, galleryImages, isOwner, sizes }: GalleryWrapperProps) => {
    const router = useRouter();
    const [columns, setColumns] = useState(5);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [viewing, setViewing] = useState<number | null>(null);
    const [toDelete, setToDelete] = useState<Photo | null>(null);
    const [deleting, setDeleting] = useState(false);
    const isAdmin = useIsAdmin();
    const [moderating, setModerating] = useState<Photo | null>(null);
    const canModerate = isAdmin && !isOwner;
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

    const confirmDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        const { error } = await deletePhoto(toDelete.id);
        setDeleting(false);
        setToDelete(null);
        if (error) return toast.error(error);
        toast.success("Photo deleted.");
        router.refresh();
    };

    // Distribute the visible photos into columns. Keeping the original index
    // means photos never move between columns when more are added.
    const distributedPhotos: { photo: Photo; index: number }[][] = Array.from({ length: columns }, () => []);
    photos.slice(0, visibleCount).forEach((photo, index) => {
        distributedPhotos[index % columns].push({ photo, index });
    });

    return (
        <>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {distributedPhotos.map((columnPhotos, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-2 sm:gap-4">
                        {columnPhotos.map(({ photo, index }) => (
                            <GalleryImage
                                key={photo.id}
                                photo={photo}
                                isOwner={isOwner}
                                onOpen={() => setViewing(index)}
                                onDelete={() => setToDelete(photo)}
                                onModerate={canModerate ? () => setModerating(photo) : undefined}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Invisible marker: loads the next batch when scrolled near */}
            {hasMore && <div ref={sentinelRef} className="h-px w-full" />}

            {viewing !== null && (
                <PhotoViewer
                    photos={galleryImages}
                    index={viewing}
                    onIndex={setViewing}
                    onClose={() => setViewing(null)}
                    sizes={sizes}
                    onModerate={
                        canModerate
                            ? (p) => {
                                  setViewing(null);
                                  setModerating(p);
                              }
                            : undefined
                    }
                    onDelete={
                        isOwner
                            ? (p) => {
                                  setViewing(null);
                                  setToDelete(p);
                              }
                            : undefined
                    }
                />
            )}

            {moderating && (
                <ModerateModal targetType="photo" targetId={moderating.id} onClose={() => setModerating(null)} />
            )}

            <ConfirmModal
                isPending={deleting}
                open={!!toDelete}
                title="Delete this photo?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </>
    );
};
