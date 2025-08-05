"use client";

import { useState } from "react";
import FallbackUserIcon from "./FallbackUserIcon";

type UserIconProps = {
    image?: string | null;
    size?: string; // e.g., "size-10"
};

export function UserIcon({ image, size = "size-10" }: UserIconProps) {
    const [imgError, setImgError] = useState(false);

    if (!image || imgError) {
        return <FallbackUserIcon size={size} />;
    }

    return (
        <img
            src={image}
            onError={() => setImgError(true)}
            className={`${size} rounded-full object-cover`}
        />
    );
}
