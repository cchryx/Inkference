"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProgressiveImg from "@/components/general/ProgressiveImg";

type Props = {
    images: string[];
};

/**
 * Swipeable image carousel that fills its parent.
 * Only the current photo and its neighbours are loaded.
 */
const PostCarousel = ({ images }: Props) => {
    const [index, setIndex] = useState(0);
    // Drag distance as a % of the carousel width (used for rendering).
    const [dragPct, setDragPct] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const dragPx = useRef(0);
    const dragging = useRef(false);

    const count = images.length;
    const prev = () => setIndex((i) => Math.max(0, i - 1));
    const next = () => setIndex((i) => Math.min(count - 1, i + 1));

    const onStart = (x: number) => {
        dragging.current = true;
        startX.current = x;
    };
    const onMove = (x: number) => {
        if (!dragging.current) return;
        let offset = x - startX.current;
        // Resist dragging past the first/last photo.
        if ((index === 0 && offset > 0) || (index === count - 1 && offset < 0)) {
            offset /= 4;
        }
        dragPx.current = offset;
        const width = containerRef.current?.offsetWidth || 1;
        setDragPct((offset / width) * 100);
    };
    const onEnd = () => {
        if (!dragging.current) return;
        dragging.current = false;
        if (dragPx.current < -50) next();
        else if (dragPx.current > 50) prev();
        dragPx.current = 0;
        setDragPct(0);
    };

    const translate = -index * 100 + dragPct;

    if (count === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No images
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none group touch-pan-y"
            onMouseDown={(e) => onStart(e.clientX)}
            onMouseMove={(e) => onMove(e.clientX)}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={(e) => onStart(e.touches[0].clientX)}
            onTouchMove={(e) => onMove(e.touches[0].clientX)}
            onTouchEnd={onEnd}
        >
            <div
                className={`flex h-full ${
                    dragPct === 0 ? "transition-transform duration-300 ease-out" : ""
                }`}
                style={{ transform: `translateX(${translate}%)` }}
            >
                {images.map((img, i) => (
                    <div key={i} className="w-full h-full flex-shrink-0">
                        {Math.abs(i - index) <= 1 && (
                            <ProgressiveImg
                                src={img}
                                alt={`Photo ${i + 1} of ${count}`}
                                previewWidth={480}
                                fullWidth={1600}
                            />
                        )}
                    </div>
                ))}
            </div>

            {count > 1 && (
                <>
                    {index > 0 && (
                        <button
                            onClick={prev}
                            aria-label="Previous photo"
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    {index < count - 1 && (
                        <button
                            onClick={next}
                            aria-label="Next photo"
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <span
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                    i === index ? "bg-white" : "bg-white/50"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        {index + 1}/{count}
                    </div>
                </>
            )}
        </div>
    );
};

export default PostCarousel;
