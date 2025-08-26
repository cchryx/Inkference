"use client";

import { useEffect, useState } from "react";
import {
    Heart,
    Eye,
    CalendarDays,
    Bookmark,
    Folder,
    Briefcase,
    GraduationCap,
    Send,
} from "lucide-react";
import { useRouter } from "next/navigation";

type PostPreviewCardProps = {
    type: string; // "project", "experience", "education", "post", etc.
    content: any;
    width?: string;
    height?: string;
};

export default function PostPreviewCard({
    type,
    content,
    width = "w-full",
    height = "h-[200px]",
}: PostPreviewCardProps) {
    const router = useRouter();
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsTouchDevice(window.matchMedia("(hover: none)").matches);
        }
    }, []);

    console.log(content);

    const thumbnailUrl =
        content.bannerImage ||
        (content.content && content.content[0]) ||
        "/assets/general/fillerImage.png";

    const handleClick = () => {
        if (!isTouchDevice) {
            if (type === "project") {
                router.push(`/project/${content.id}`);
            } else if (type === "experience") {
                router.push(`/experience/${content.id}`);
            } else if (type === "education") {
                router.push(`/education/${content.id}`);
            } else {
                router.push(`/post/${content.id}`);
            }
        } else {
            if (isOverlayVisible) {
                router.push(`/post/${content.id}`);
            } else {
                setIsOverlayVisible(true);
                setTimeout(() => setIsOverlayVisible(false), 3000);
            }
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case "project":
                return <Folder className="size-4 md:size-6 text-white" />;
            case "experience":
                return <Briefcase className="size-4 md:size-6 text-white" />;
            case "education":
                return (
                    <GraduationCap className="size-4 md:size-6 text-white" />
                );
            case "post":
                return <Send className="size-4 md:size-6 text-white" />;
        }
    };

    // Stats
    const likes = Array.isArray(content.likes) ? content.likes.length : 0;
    const views = Array.isArray(content.views) ? content.views.length : 0;
    const saves = Array.isArray(content.saves) ? content.saves.length : 0;
    const postedAt = content.createdAt
        ? new Date(content.createdAt).toISOString()
        : "";
    const formattedDate = new Date(postedAt).toLocaleDateString("en-GB");

    return (
        <div
            onClick={handleClick}
            className={`group relative ${width} ${height} rounded-md shadow-md hover:shadow-xl transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.015] duration-300 overflow-hidden flex flex-col cursor-pointer`}
            style={{
                backgroundImage: `url('${thumbnailUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Post type icon top right */}
            <div className="absolute right-4 top-4 z-21 flex flex-col space-y-2">
                {getTypeIcon()}
            </div>

            {/* Overlay with stats */}
            <div
                className={`absolute inset-0 z-20 bg-black/50 backdrop-blur-[1px] text-white ${
                    isOverlayVisible
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                } transition-opacity duration-300 flex flex-col justify-between p-4 text-sm pointer-events-none`}
            >
                <div className="text-[0.5rem] md:text-xs bg-white/10 px-2 py-1 rounded-md font-medium w-fit text-white shadow-sm">
                    Click to view
                </div>

                <div className="flex flex-col gap-0.5 text-xs md:text-md">
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Eye className="size-3 md:size-4" /> {views}
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Heart className="size-3 md:size-4" /> {likes}
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Bookmark className="size-3 md:size-4" /> {saves}
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <CalendarDays className="size-3 md:size-4" />
                        {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
}
