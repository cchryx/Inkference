"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { ChevronDown, ChevronRight, Pen, Pencil } from "lucide-react";

interface SkillsCardProps {
    isOwner: boolean;
    skills: string[];
}

const SkillsCard = ({ isOwner, skills }: SkillsCardProps) => {
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
                <div className="flex gap-2">
                    <h2 className="text-lg font-semibold">
                        Project Skills ({skills.length})
                    </h2>
                    {isOwner && (
                        <button
                            onClick={() => {}}
                            className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={toggleMinimize}
                    className="text-gray-600 hover:text-black transition cursor-pointer"
                    aria-label={
                        isMinimized ? "Expand skills" : "Collapse skills"
                    }
                >
                    {isMinimized ? (
                        <ChevronRight className="size-6" />
                    ) : (
                        <ChevronDown className="size-6" />
                    )}
                </button>
            </div>

            {!isMinimized && skills.length > 0 && (
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
