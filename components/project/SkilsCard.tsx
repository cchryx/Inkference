"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

const skills = [
    "React",
    "Tailwind",
    "TypeScript",
    "Next.js",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
    "UI/UX",
];

const SkillsCard = () => {
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
                <div className="flex-1 overflow-x-auto flex gap-3 pb-1 whitespace-nowrap">
                    {[...Array(skills.length)].map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-8 w-24 rounded-full bg-gray-300"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Project Skills ({skills.length})
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
                <div className="flex-1 overflow-x-auto flex gap-2 pr-1 whitespace-nowrap yes-scrollbar">
                    {skills.map((skill, index) => (
                        <div
                            key={index}
                            className="px-4 py-1 text-sm rounded-full bg-gray-300 text-gray-800 hover:brightness-90 cursor-default mb-3"
                        >
                            {skill}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SkillsCard;
