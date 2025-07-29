"use client";

import { useEffect, useState } from "react";
import { Heart, Eye, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
    bannerUrl?: string;
    iconUrl?: string;
    name: string;
    description: string;
    status: "In Progress" | "Complete";
    startDate: string;
    endDate: string;
    skills: string[];
    likes: number;
    views: number;
    postedAt: string;
};

export default function ProjectCard({ project }: { project: Project }) {
    const router = useRouter();
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsTouchDevice(window.matchMedia("(hover: none)").matches);
        }
    }, []);

    const formattedDate = new Date(project.postedAt).toLocaleDateString(
        "en-GB"
    );

    const handleClick = () => {
        if (!isTouchDevice) {
            // Desktop: go immediately
            router.push(`/project/${project.name}`);
        } else {
            // Mobile: tap-to-reveal first
            if (isOverlayVisible) {
                router.push(`/project/${project.name}`);
            } else {
                setIsOverlayVisible(true);
                setTimeout(() => setIsOverlayVisible(false), 3000);
            }
        }
    };

    const banner = project.bannerUrl || "/assets/general/fillerImage.png";
    const icon = project.iconUrl || "/assets/general/folder.png";

    return (
        <div
            onClick={handleClick}
            className="group relative h-[400px] bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.015] duration-300 overflow-hidden flex flex-col cursor-pointer"
        >
            {/* Banner Image */}
            <div
                className="h-32 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url('${banner}')` }}
            />

            {/* Project Icon (overlapping square) */}
            <div className="absolute right-4 top-[5rem]">
                <img
                    src={icon}
                    alt={`${project.name} icon`}
                    className="size-18 rounded-md border-2 border-white shadow-md object-cover"
                />
            </div>

            {/* Card Body */}
            <div className="flex-1 bg-gray-200 p-4 pt-8 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                        {project.name}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-4">
                        {project.description}
                    </p>
                </div>

                <div className="mt-3">
                    <p className="text-xs text-gray-500">
                        Status:{" "}
                        <span
                            className={
                                project.status === "Complete"
                                    ? "text-green-600 font-medium"
                                    : "text-yellow-600 font-medium"
                            }
                        >
                            {project.status}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Duration: {project.startDate} – {project.endDate}
                    </p>
                </div>

                <div className="mt-3 overflow-hidden max-h-[3.2rem] flex flex-wrap gap-1">
                    {project.skills.map((skill, idx) => (
                        <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Hover / Tap Stats Overlay */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] text-white ${
                    isOverlayVisible
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                } transition-opacity duration-300 flex flex-col justify-between p-4 text-sm pointer-events-none`}
            >
                {/* Top-Left Message */}
                <div className="text-xs bg-white/10 px-2 py-1 rounded-md font-medium w-fit text-white shadow-sm">
                    Click to view project in detail
                </div>

                {/* Bottom Stats */}
                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Heart className="w-4 h-4" /> {project.likes} Likes
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Eye className="w-4 h-4" /> {project.views} Views
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
