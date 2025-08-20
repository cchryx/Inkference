"use client";

import React, { useState, useMemo } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Modal from "@/components/general/Modal";
import Loader from "@/components/general/Loader";
import { useSearchSkills } from "@/hooks/useSearchSkills";
import { addSkill } from "@/actions/content/skill/addSkill";
import { deleteSkill } from "@/actions/content/skill/deleteSkill";
import Img from "@/components/general/Img";

type Props = {
    open: boolean;
    onClose: () => void;
    projectId?: string;
    initialSkills: any[];
};

const EditSkillsModal = ({
    open,
    onClose,
    projectId,
    initialSkills,
}: Props) => {
    const router = useRouter();
    const [skills, setSkills] = useState<any[]>(initialSkills);
    const [showInput, setShowInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, setIsPending] = useState(false);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSearchSkills(searchQuery);

    const handleAddSkill = (skill: any) => {
        const normalizedName = skill.name.trim().toLowerCase();
        if (
            skills.find((s) => s.name.trim().toLowerCase() === normalizedName)
        ) {
            toast.error("Skill already added.");
            return;
        }

        const allSkills = data?.pages.flatMap((page) => page.skills) || [];
        const existing = allSkills.find(
            (s) => s.name.trim().toLowerCase() === normalizedName
        );

        const finalSkill = existing || skill;

        setSkills((prev) => [finalSkill, ...prev]);
        setSearchQuery("");
        setShowInput(false);
    };

    const handleRemove = (idOrName: string) => {
        setSkills((prev) =>
            prev.filter((s) => s.id !== idOrName && s.name !== idOrName)
        );
    };

    const handleSave = async () => {
        setIsPending(true);

        try {
            const initialIdsOrNames = initialSkills.map((s) => s.id ?? s.name);
            const currentIdsOrNames = skills.map((s) => s.id ?? s.name);

            // 1. Remove deleted skills
            const removedSkills = initialSkills.filter(
                (s) => !currentIdsOrNames.includes(s.id ?? s.name)
            );

            await Promise.all(
                removedSkills.map(async (skill) => {
                    if (skill.id) {
                        await deleteSkill(skill.id, projectId);
                    }
                })
            );

            // 2. Add new skills
            const addedSkills = skills.filter(
                (s) => !initialIdsOrNames.includes(s.id ?? s.name)
            );

            for (const skill of addedSkills) {
                await addSkill({ name: skill.name }, projectId);
            }

            toast.success("Skills updated successfully.");
            router.refresh();
            onClose();
        } catch (err: any) {
            toast.error(err?.message || "Error updating skills.");
        }

        setIsPending(false);
    };

    const filteredSkills = useMemo(() => {
        const allSkills = data?.pages.flatMap((page) => page.skills) || [];
        return allSkills.filter(
            (s) => !skills.find((sk) => sk.id === s.id || sk.name === s.name)
        );
    }, [data, skills]);

    const handleClose = () => {
        setSkills(initialSkills);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw] bg-gray-100 rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Edit Skills</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Add skill button */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {skills.length} skill{skills.length !== 1 && "s"}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowInput((prev) => !prev)}
                            className="w-fit text-xs px-2 py-1 h-auto mt-1 cursor-pointer"
                        >
                            {showInput ? "Cancel" : "+ Add Skill"}
                        </Button>
                    </div>

                    {/* Search input */}
                    {showInput && (
                        <div className="space-y-2">
                            <Input
                                placeholder="Search or add a skill..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                maxLength={60}
                                className="w-full"
                            />
                            {searchQuery.trim() !== "" && (
                                <div
                                    className="bg-white border rounded-md shadow-sm max-h-48 overflow-y-auto"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        if (
                                            target.scrollTop +
                                                target.clientHeight >=
                                                target.scrollHeight - 10 &&
                                            hasNextPage &&
                                            !isFetchingNextPage
                                        ) {
                                            fetchNextPage();
                                        }
                                    }}
                                >
                                    {/* Always show add option at the top */}
                                    <div className="px-3 py-2 flex justify-between items-center max-w-full border-b">
                                        <span className="truncate max-w-[70%] text-sm text-gray-500">
                                            Add new skill
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAddSkill({
                                                    name: searchQuery.trim(),
                                                })
                                            }
                                            className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm truncate md:max-w-[25%] max-w-[60%]"
                                        >
                                            + Add "{searchQuery}"
                                        </button>
                                    </div>

                                    {/* Then show suggestions */}
                                    {filteredSkills.length > 0 ? (
                                        filteredSkills.map((skill: any) => (
                                            <div
                                                key={skill.id}
                                                onClick={() =>
                                                    handleAddSkill(skill)
                                                }
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer truncate"
                                            >
                                                <Img
                                                    src={
                                                        skill.iconImage ||
                                                        "/assets/general/fillers/skill.png"
                                                    }
                                                    fallbackSrc="/assets/general/fillers/skill.png"
                                                    className="size-6 rounded-sm object-contain"
                                                />
                                                <p className="truncate max-w-full">
                                                    {skill.name}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            No matching skills
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills list */}
                    <ul className="space-y-2">
                        {skills.map((skill) => (
                            <li
                                key={skill.id ?? skill.name}
                                className="flex items-center justify-between gap-3 border rounded-xl px-3 py-2"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Img
                                        src={
                                            skill.iconImage ||
                                            "/assets/general/fillers/skill.png"
                                        }
                                        fallbackSrc="/assets/general/fillers/skill.png"
                                        className="size-6 rounded-sm object-contain"
                                    />
                                    <p className="text-sm truncate">
                                        {skill.name}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleRemove(skill.id ?? skill.name)
                                    }
                                    className="p-2 text-gray-600 hover:text-red-600 rounded-lg cursor-pointer"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditSkillsModal;
