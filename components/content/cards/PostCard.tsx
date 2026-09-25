"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { previewUrl } from "@/lib/imageUrl";
import { timeShort } from "@/lib/timeShort";
import Caption from "@/components/content/post/Caption";

type Props = {
    post: any;
    description: string;
    location: string;
};

const PostCard = ({ post, description, location }: Props) => {
    const username: string | undefined = post?.author?.username;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [showFullDescription, setShowFullDescription] = useState(false);

    const images = post?.content || [];
    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const isDragging = useRef(false);

    // Carousel navigation
    const prevImage = () => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    };

    const nextImage = () => {
        if (currentIndex < images.length - 1)
            setCurrentIndex((prev) => prev + 1);
    };

    // Drag handling (prioritize horizontal swipe)
    const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        isDragging.current = true;
        startX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    };

    const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging.current) return;
        const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
        let offset = currentX - startX.current;

        // Prevent dragging beyond first/last image
        if (
            (currentIndex === 0 && offset > 0) ||
            (currentIndex === images.length - 1 && offset < 0)
        ) {
            offset = 0;
        }

        setDragOffset(offset);
    };

    const handleDragEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (dragOffset < -50) nextImage();
        else if (dragOffset > 50) prevImage();

        setDragOffset(0);
    };

    const translateX =
        -currentIndex * 100 +
        (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100;

    return (
        <div className="relative select-none w-full h-[70vh] md:w-[50vw] xl:w-[35vw] lg:h-[90vh] bg-gray-100 lg:rounded-lg overflow-hidden flex flex-col">
            {/* Image Carousel */}
            <div
                ref={containerRef}
                className="relative flex-1 flex items-center justify-center overflow-hidden group cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                <div
                    className="flex w-full transition-transform duration-150 ease-out"
                    style={{ transform: `translateX(${translateX}%)` }}
                >
                    {images.map((img: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex-shrink-0 w-full flex items-center justify-center"
                        >
                            <img
                                src={previewUrl(img, 1080)}
                                className="w-full object-cover select-none pointer-events-none"
                            />
                        </div>
                    ))}
                </div>

                {/* Desktop arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={nextImage}
                            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-1/20 left-1/2 -translate-x-1/2 flex gap-2 pb-1">
                            {images.map((_: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${
                                        idx === currentIndex
                                            ? "bg-black"
                                            : "bg-black/50"
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Full caption: slides up over the photo, tap outside the text to close */}
                <div
                    onClick={() => setShowFullDescription(false)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/50 to-transparent transition-opacity duration-200 ${
                        showFullDescription ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`max-h-[65%] w-full overflow-y-auto no-scrollbar px-4 pb-4 pt-10 text-white transition-transform duration-200 ${
                            showFullDescription ? "translate-y-0" : "translate-y-4"
                        }`}
                    >
                        {showFullDescription && (
                            <Caption
                                text={description}
                                username={username}
                                expanded
                                onToggle={setShowFullDescription}
                                className="[&_a]:!text-sky-300 [&_button]:!text-white/70"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Caption under the photo (2 lines, "more" only if it's cut off) */}
            {(description || location || post?.createdAt) && (
                <div className="px-3 py-2.5 space-y-1">
                    {description && (
                        <Caption
                            text={description}
                            username={username}
                            lines={2}
                            onToggle={setShowFullDescription}
                            // Kept in place (just hidden) so nothing jumps when opened.
                            className={showFullDescription ? "invisible" : ""}
                        />
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        {post?.createdAt && <span>{timeShort(post.createdAt)}</span>}
                        {location && (
                            <>
                                {post?.createdAt && <span aria-hidden>·</span>}
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{location}</span>
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PostCard;
