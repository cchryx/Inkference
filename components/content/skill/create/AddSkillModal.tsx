"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import InfoTooltip from "@/components/general/InfoToolTip";
import { useRouter } from "next/navigation";
import { addSkill } from "@/actions/content/skill/addSkill";
import { useSearchSkills } from "@/hooks/useSearchSkills";
import Img from "@/components/general/Img";

type Props = {
    onCloseModal: () => void;
    onSkillAdded?: (skill: any) => void; // send newly added skill to parent
};

export default function AddSkillModal({ onCloseModal, onSkillAdded }: Props) {
    const [name, setName] = useState("");
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();
    const { data } = useSearchSkills(name);

    // Flatten skills pages for suggestions
    const suggestedSkills = useMemo(() => {
        const allSkills = data?.pages.flatMap((page) => page.skills) || [];
        // Filter out exact matches
        return allSkills.filter(
            (s) => s.name.toLowerCase() !== name.trim().toLowerCase()
        );
    }, [data, name]);

    // Check if input is close to existing skill
    const existingSkill = useMemo(() => {
        return data?.pages
            .flatMap((page) => page.skills)
            .find(
                (s) =>
                    s.name.toLowerCase() === name.trim().toLowerCase() ||
                    s.name.toLowerCase().includes(name.trim().toLowerCase())
            );
    }, [data, name]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Skill name is required.");
            return;
        }

        if (existingSkill) {
            setName(existingSkill.name);
        }

        setIsPending(true);
        try {
            const result = await addSkill({ name: trimmedName });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Skill added successfully.");
                onSkillAdded?.(result);
                onCloseModal();
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to add skill.");
            console.error(error);
        }
        setIsPending(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl w-full md:w-[70%] lg:w-[40%] shadow-lg flex flex-col max-h-[90vh]">
                {/* Top Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Add Skill</h2>
                    <button
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                >
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <Label htmlFor="name">Skill Name</Label>
                            <InfoTooltip text="Enter the name of the skill (max 60 chars)" />
                        </div>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            placeholder="Start typing skill name..."
                            onChange={(e) =>
                                setName(e.target.value.slice(0, 60))
                            }
                        />
                        <span className="text-xs text-gray-500">
                            {60 - name.length} characters left
                        </span>

                        {/* Suggestions */}
                        {name.trim() && suggestedSkills.length > 0 && (
                            <div className="bg-white border rounded-md shadow-sm mt-2 max-h-48 overflow-y-auto">
                                {suggestedSkills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setName(skill.name)}
                                    >
                                        <Img
                                            src={
                                                skill.iconImage ||
                                                "/assets/general/fillers/skill.png"
                                            }
                                            fallbackSrc="/assets/general/fillers/skill.png"
                                            className="size-6 rounded-sm object-contain"
                                        />
                                        <span className="truncate">
                                            {skill.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl">
                    <Button
                        onClick={handleSubmit}
                        type="submit"
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        Add Skill
                    </Button>
                </div>
            </div>
        </div>
    );
}
