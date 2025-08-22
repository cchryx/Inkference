"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "./Skeleton";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
    src: string | Blob; // now supports Blob
};

const Img = ({
    src,
    alt,
    fallbackSrc = "/assets/general/fillerImage.png",
    className = "",
    ...props
}: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    // Convert Blob to object URL if needed
    useEffect(() => {
        if (!src) return;

        if (src instanceof Blob) {
            const url = URL.createObjectURL(src);
            setObjectUrl(url);

            // Clean up the object URL on unmount
            return () => {
                URL.revokeObjectURL(url);
                setObjectUrl(null);
            };
        } else {
            setObjectUrl(src);
        }
    }, [src]);

    // Handle cached images
    useEffect(() => {
        if (!objectUrl) return;
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => setLoading(false);
        img.onerror = () => {
            setError(true);
            setLoading(false);
        };
    }, [objectUrl]);

    return (
        <div className={`relative ${className}`}>
            {/* Skeleton while loading */}
            {loading && !error && (
                <Skeleton className="absolute inset-0 w-full h-full" />
            )}

            <img
                src={error ? fallbackSrc : objectUrl ?? undefined}
                alt={alt}
                className={`transition-opacity select-none duration-300 w-full h-full object-cover ${
                    loading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setError(true);
                    setLoading(false);
                }}
                {...props}
            />
        </div>
    );
};

export default Img;
