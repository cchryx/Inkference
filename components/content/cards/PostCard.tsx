"use client";

import { useState, useRef, useEffect } from "react";
import Img from "@/components/general/Img";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
    post: any;
    description: string;
    location: string;
};

const PostCard = ({ post, description, location }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const images = post?.content || [];
    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const isDragging = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const startTouchY = useRef(0);

    // Drag functions
    const prevImage = () => {
        if (currentIndex === 0) return;
        setCurrentIndex((prev) => prev - 1);
    };

    const nextImage = () => {
        if (currentIndex === images.length - 1) return;
        setCurrentIndex((prev) => prev + 1);
    };

    const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        isDragging.current = true;
        startX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    };

    const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging.current) return;
        const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
        let offset = currentX - startX.current;

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

    // Check scroll for fade indicators
    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setCanScrollUp(scrollTop > 0);
        setCanScrollDown(scrollTop + clientHeight < scrollHeight);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);

        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [showFullDescription, description]);

    // Prevent scroll propagation
    const handleWheel = (e: React.WheelEvent) => {
        const el = scrollRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const delta = e.deltaY;

        if (
            (delta < 0 && scrollTop === 0) ||
            (delta > 0 && scrollTop + clientHeight >= scrollHeight)
        ) {
            e.stopPropagation();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startTouchY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const el = scrollRef.current;
        if (!el) return;

        const currentY = e.touches[0].clientY;
        const deltaY = startTouchY.current - currentY;

        if (
            (deltaY < 0 && el.scrollTop === 0) ||
            (deltaY > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight)
        ) {
            e.stopPropagation();
        }
    };

    return (
        <div className="relative select-none w-full h-[70vh] md:w-[50vw] lg:w-[30vw] lg:h-[90vh] bg-gray-200 rounded-lg overflow-hidden flex flex-col">
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
                            <Img
                                src={img}
                                className="w-full object-contain select-none pointer-events-none"
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

                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 pb-1">
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

                {/* Full description overlay */}
                {showFullDescription && (
                    <div className="absolute bottom-0 left-0 w-full h-[70%] bg-white/70 p-4 transition-all duration-200 flex flex-col">
                        {/* Close button fixed at top */}
                        <button
                            onClick={() => setShowFullDescription(false)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable description with fade indicators */}
                        <div className="relative mt-6 flex-1 overflow-hidden">
                            <div
                                ref={scrollRef}
                                className="overflow-y-auto scrollbar-none whitespace-pre-wrap text-sm h-full no-scrollbar"
                                onWheel={handleWheel}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                            >
                                {description}
                            </div>

                            {/* Top fade */}
                            {canScrollUp && (
                                <div className="pointer-events-none absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-white/70 to-transparent" />
                            )}

                            {/* Bottom fade */}
                            {canScrollDown && (
                                <div className="pointer-events-none absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/70 to-transparent" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Collapsed description with "See More" */}
            {!showFullDescription && description && (
                <div className="text-sm m-3 relative">
                    <div className="line-clamp-2 break-all whitespace-pre-wrap">
                        {description}
                    </div>
                    {description.length > 100 && (
                        <div className="mt-1">
                            <button
                                onClick={() => setShowFullDescription(true)}
                                className="text-blue-500"
                            >
                                See More
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;
