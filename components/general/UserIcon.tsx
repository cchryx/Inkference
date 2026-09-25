"use client";

import { useState, useEffect } from "react";
import FallbackUserIcon from "./FallbackUserIcon";
import { previewUrl } from "@/lib/imageUrl";

type UserIconProps = {
    image?: string | null;
    size?: string; // e.g., "size-10"
};

export function UserIcon({ image, size = "size-10" }: UserIconProps) {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [image]);

    if (!image || imgError) {
        return <FallbackUserIcon size={size} />;
    }

    return (
        <img
            src={previewUrl(image, 400)}
            onError={() => setImgError(true)}
            className={`${size} rounded-full object-cover`}
        />
    );
}
