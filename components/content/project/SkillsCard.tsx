"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../../general/Skeleton";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import EditSkillsModal from "./edit/EditSkillsModal";
import Img from "@/components/general/Img"; // make sure you have this component

interface SkillsCardProps {
    isOwner: boolean;
    skills: any[];
    projectId: string;
}

const SkillsCard = ({ isOwner, skills, projectId }: SkillsCardProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleMinimize = () => setIsMinimized((prev) => !prev);

    if (isLoading) {
        return (
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                        <Skeleton className="w-32 h-6 rounded-md" />
                    </div>
                </div>

                {/* Skill chips skeleton */}
                <div className="flex-1 overflow-x-auto flex gap-3 pr-1 whitespace-nowrap">
                    {[...Array(Math.max(skills.length || 3, 3))].map((_, i) => (
                        <div
                            key={i}
                            className="w-fit cursor-pointer flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-gray-300 rounded-md"
                        >
                            <Skeleton className="w-5 h-5 rounded-md" />
                            <Skeleton className="w-20 h-4 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Edit Skills Modal */}
            <EditSkillsModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                projectId={projectId}
                initialSkills={skills}
            />

            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <h2 className="text-lg font-semibold">
                            Project Skills ({skills.length})
                        </h2>
                        {isOwner && (
                            <button
                                onClick={() => setEditOpen(true)}
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
                    <div className="flex-1 overflow-x-auto flex gap-3 pr-1 whitespace-nowrap yes-scrollbar">
                        {skills.map((skill, index) => (
                            <div
                                key={skill.id ?? index}
                                className="cursor-pointer flex-shrink-0 mb-3 flex items-center gap-2 px-3 py-1 bg-gray-300 rounded-md hover:brightness-95 transition text-gray-800 truncate"
                                title={skill.name}
                            >
                                {skill.iconImage && (
                                    <Img
                                        src={skill.iconImage}
                                        fallbackSrc="/assets/general/fillers/skill.png"
                                        alt={`${skill.name} icon`}
                                        className="w-5 h-5 rounded-sm object-contain"
                                    />
                                )}
                                <span>{skill.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SkillsCard;
