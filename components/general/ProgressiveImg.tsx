"use client";

import { useState } from "react";
import { previewUrl } from "@/lib/imageUrl";
import Loader from "./Loader";

type Props = {
    src: string;
    alt?: string;
    className?: string;
    previewWidth?: number;
    // Optional: cap the "full" image at this width instead of the original.
    fullWidth?: number;
};

/**
 * Fills its parent (give the parent a fixed width/height), so the box never
 * jumps in size while images load or when switching between photos.
 *
 * Shows the small preview right away (usually already cached from the
 * grid), downloads the full image in the background, then fades it in.
 */
const ProgressiveImg = ({
    src,
    alt = "",
    className = "",
    previewWidth = 640,
    fullWidth,
}: Props) => {
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const full = fullWidth ? previewUrl(src, fullWidth) : src;
    const preview = previewUrl(src, previewWidth);
    const hasPreview = preview !== full;
    const fullLoaded = !hasPreview || loadedSrc === full;

    const imgClass =
        "absolute inset-0 w-full h-full object-contain select-none transition-opacity duration-300";

    return (
        <div className={`relative w-full h-full ${className}`}>
            {hasPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={`preview-${src}`}
                    src={preview}
                    alt=""
                    aria-hidden
                    className={`${imgClass} ${fullLoaded ? "opacity-0" : "opacity-100"}`}
                />
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                key={full}
                src={full}
                alt={alt}
                decoding="async"
                onLoad={() => setLoadedSrc(full)}
                className={`${imgClass} ${fullLoaded ? "opacity-100" : "opacity-0"}`}
            />

            {!fullLoaded && (
                <div className="absolute top-3 right-3 rounded-full bg-black/40 p-1.5">
                    <Loader size={5} color="text-white" />
                </div>
            )}
        </div>
    );
};

export default ProgressiveImg;
