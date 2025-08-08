"use client";

import { useEffect, useState } from "react";
import { Heart, Eye, CalendarDays, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectCardProps = {
    project: any;
    width?: string; // e.g. "w-[400px]" or "w-full" or "w-96"
    height?: string; // e.g. "h-[400px]" or "h-96"
};

export default function ProjectCard({
    project,
    width = "w-full",
    height = "h-[400px]",
}: ProjectCardProps) {
    const router = useRouter();
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsTouchDevice(window.matchMedia("(hover: none)").matches);
        }
    }, []);

    const bannerUrl = project.bannerImage || "/assets/general/fillerImage.png";
    const iconUrl = project.iconImage || "/assets/general/folder.png";
    const name = project.name;
    const summary = project.summary || "No summary provided.";
    const status =
        project.status === "IN_PROGRESS" ? "In Progress" : "Complete";
    const startDate = project.startDate
        ? new Date(project.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "";

    const endDate = project.endDate
        ? new Date(project.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "Present";
    const skills = project.skills ?? [];
    const likes = Array.isArray(project.likes) ? project.likes.length : 0;
    const views = Array.isArray(project.views) ? project.views.length : 0;
    const saves = Array.isArray(project.saves) ? project.saves.length : 0;
    const postedAt = project.createdAt
        ? new Date(project.createdAt).toISOString()
        : "";
    const formattedDate = new Date(postedAt).toLocaleDateString("en-GB");

    const handleClick = () => {
        if (!isTouchDevice) {
            router.push(`/project/${project.id}`);
        } else {
            if (isOverlayVisible) {
                router.push(`/project/${project.id}`);
            } else {
                setIsOverlayVisible(true);
                setTimeout(() => setIsOverlayVisible(false), 3000);
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative ${width} ${height} bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.015] duration-300 overflow-hidden flex flex-col cursor-pointer`}
        >
            {/* Banner */}
            <div
                className="h-32 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url('${bannerUrl}')` }}
            />

            {/* Icon */}
            <div className="absolute right-4 top-[5rem]">
                <img
                    src={iconUrl}
                    alt={`${name} icon`}
                    className="size-18 rounded-md border-2 border-white shadow-md object-cover bg-gray-800/50"
                />
            </div>

            {/* Body */}
            <div className="flex-1 bg-gray-200 p-4 pt-8 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                        {name}
                    </h2>
                    <p className="text-xs text-gray-600 line-clamp-4">
                        {summary}
                    </p>
                </div>

                <div className="mt-3">
                    <p className="text-xs text-gray-500">
                        Status:{" "}
                        <span
                            className={
                                status === "Complete"
                                    ? "text-green-600 font-medium"
                                    : "text-yellow-600 font-medium"
                            }
                        >
                            {status}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Duration: {startDate} – {endDate}
                    </p>
                </div>

                <div className="mt-3 overflow-hidden max-h-[3.2rem] flex flex-wrap gap-1">
                    {skills.map((skill: string, idx: number) => (
                        <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] text-white ${
                    isOverlayVisible
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                } transition-opacity duration-300 flex flex-col justify-between p-4 text-sm pointer-events-none`}
            >
                <div className="text-xs bg-white/10 px-2 py-1 rounded-md font-medium w-fit text-white shadow-sm">
                    Click to view project in detail
                </div>

                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Eye className="w-4 h-4" /> {views} Views
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Heart className="w-4 h-4" /> {likes} Likes
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Bookmark className="w-4 h-4" /> {saves} Saves
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <CalendarDays className="w-4 h-4" /> Posted:{" "}
                        {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
}
