"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import InfoTooltip from "@/components/general/InfoToolTip";
import { useRouter } from "next/navigation";
import { addSkill } from "@/actions/content/skill/addSkill";
import { useSearchSkills } from "@/hooks/useSearchSkills";
import Img from "@/components/general/Img";
import { previewUrl } from "@/lib/imageUrl";

type Props = {
    skills: any[];
    onCloseModal: () => void;
    onSkillAdded?: (skill: any) => void; // send newly added skill to parent
};

export default function AddSkillModal({
    skills,
    onCloseModal,
    onSkillAdded,
}: Props) {
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

        const alreadyAdded = skills.some(
            (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (alreadyAdded) {
            toast.error("This skill already exists in your list.");
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
        <StepModal
            title="Add skill"
            subtitle="Pick an existing skill or create a new one"
            onClose={onCloseModal}

            onSubmit={handleSubmit}
            submitLabel="Add skill"
            pending={isPending}
            disabled={!name.trim()}
        >
            <form onSubmit={handleSubmit}>
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
                                        previewUrl(skill.iconImage, 96) ||
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
        </StepModal>
    );
}
