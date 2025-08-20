"use client";

import { BriefcaseBusiness, Folder, Link, Trash } from "lucide-react";
import Img from "@/components/general/Img";
import ConfirmModal from "@/components/general/ConfirmModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSkill } from "@/actions/content/skill/deleteSkill";

type SkillItem = {
    id: string;
    name: string;
    iconImage?: string | null;
    projects: any[];
    experiences: any[];
};

type SkillCardProps = {
    skill: SkillItem;
    rootUser?: boolean;
};

const SkillCard = ({ skill, rootUser = false }: SkillCardProps) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);

    const handleDeleteSkill = async () => {
        setIsPending(true);
        const { error } = await deleteSkill(skill.id);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Skill deleted successfully.");
            router.refresh();
        }
        setIsPending(false);
    };

    return (
        <>
            <ConfirmModal
                isPending={isPending}
                open={confirmMopen}
                title="Delete this skill?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteSkill();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />

            <div className="bg-gray-200 cursor-pointer rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.01] duration-300 overflow-hidden flex flex-col p-4 gap-2 relative">
                {/* Title with Icon */}
                <div className="flex justify-between items-start gap-2">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg truncate flex-1">
                        {skill.name}
                    </h2>
                    <div className="w-12 h-12 flex-shrink-0">
                        <Img
                            src={
                                skill.iconImage ||
                                "/assets/general/fillers/skill.png"
                            }
                            fallbackSrc="/assets/general/fillers/skill.png"
                            alt={`${skill.name} icon`}
                            className="w-full h-full object-contain rounded-md"
                        />
                    </div>
                </div>

                <div className="flex flex-col h-24 w-[90%] overflow-y-auto pr-1 mt-2 flex-none">
                    {/* Projects */}
                    {skill.projects.map((proj, index) => (
                        <a
                            key={`proj-${proj.id}-${index}`}
                            href={`/project/${proj.id}`}
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm truncate hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded flex-none"
                        >
                            <Folder className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{proj.name}</span>
                        </a>
                    ))}

                    {/* Experiences */}
                    {skill.experiences.map((exp, index) => (
                        <div
                            key={`exp-${index}`}
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm truncate hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded flex-none"
                        >
                            <BriefcaseBusiness className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{exp}</span>
                        </div>
                    ))}
                </div>

                {/* Delete Button at bottom-right corner */}
                {rootUser && (
                    <div className="absolute bottom-2 right-2">
                        <button
                            className="cursor-pointer text-black hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition"
                            onClick={() => setConfirmMOpen(true)}
                        >
                            <Trash className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default SkillCard;
