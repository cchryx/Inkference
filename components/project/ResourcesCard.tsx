"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { ChevronDown, ChevronRight, Link2 } from "lucide-react";

const links = [
    "https://www.example.com/this/is/a/very/long/url/that/keeps/going/and/going/and/might/wrap/or/truncate/depending/on/your/styles",
    "https://github.com/username/very-long-repo-name-with-dashes-and-descriptions-that-make-the-link-wide",
    "https://www.figma.com/file/really-really-really-long-design-document-id-that-is-hard-to-fit-in-one-line",
    "https://docs.google.com/document/d/1xYz7LmWhYVVxMxMjJ1TLx4g2P3PbN9LtV5EtxH5HgU0/edit?usp=sharing",
    "https://cdn.example.com/assets/images/users/profiles/pictures/this-is-a-really-long-image-name-with-many-dashes.jpg",
    "https://stackoverflow.com/questions/12345678/this-is-an-example-of-a-very-detailed-question-title-that-is-part-of-the-url",
    "https://blog.example.dev/posts/2025/07/long-title-post-with-keywords-and-search-friendly-url-slugs-included",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890abcdefghijklmnopqrstuvwxyz&index=42",
    "https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow?utm_source=tool&utm_medium=chatgpt",
    "https://yourdomain.com/dashboard/user/settings/preferences/advanced/network/custom-routing/rules/configurations",
];

const ResourcesCard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleMinimize = () => setIsMinimized((prev) => !prev);

    if (isLoading) {
        return (
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-[30%] h-6 rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full rounded-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2 max-h-[300px]">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Resources ({links.length})
                </h2>
                <button
                    onClick={toggleMinimize}
                    className="text-gray-600 hover:text-black transition cursor-pointer"
                >
                    {isMinimized ? (
                        <ChevronRight className="size-6" />
                    ) : (
                        <ChevronDown className="size-6" />
                    )}
                </button>
            </div>

            {!isMinimized && (
                <div className="overflow-y-auto flex flex-col gap-2 pr-1 yes-scrollbar text-sm">
                    {links.map((url, index) => (
                        <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 hover:brightness-90 bg-gray-300 px-2 py-1 rounded-sm cursor-pointer w-full"
                        >
                            <Link2 className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate overflow-hidden whitespace-nowrap w-full text-gray-800">
                                {url}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResourcesCard;
