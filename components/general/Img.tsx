"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "./Skeleton";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
    src: string | Blob;
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
    const [isInView, setIsInView] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer to detect if image is in viewport
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect(); // stop observing once in view
                    }
                });
            },
            {
                rootMargin: "200px", // start loading slightly before in view
            }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Convert Blob to object URL if needed
    useEffect(() => {
        if (!isInView) return; // only generate URL if image is in view
        if (!src) return;

        if (src instanceof Blob) {
            const url = URL.createObjectURL(src);
            setObjectUrl(url);

            return () => {
                URL.revokeObjectURL(url);
                setObjectUrl(null);
            };
        } else {
            setObjectUrl(src);
        }
    }, [src, isInView]);

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
        <div ref={containerRef} className={`relative ${className}`}>
            {loading && !error && (
                <Skeleton className="absolute inset-0 w-full h-full" />
            )}

            {isInView && (
                <img
                    src={error ? fallbackSrc : objectUrl ?? undefined}
                    alt={alt}
                    className={`transition-opacity select-none duration-300 w-full h-full object-cover ${
                        loading ? "opacity-0" : "opacity-100"
                    } ${className}`}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setError(true);
                        setLoading(false);
                    }}
                    {...props}
                />
            )}
        </div>
    );
};

export default Img;
