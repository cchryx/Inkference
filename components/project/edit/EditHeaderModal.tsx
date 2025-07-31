"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { editProject } from "@/actions/content/project/editProject";
import { useRouter } from "next/navigation";

import Modal from "@/components/general/Modal";
import Step1 from "../create/Step1";
import Step2 from "../create/Step2";
import Step3 from "../create/Step3";
import Step4 from "../create/Step4";
import Step5 from "../create/Step5";
import Loader from "@/components/general/Loader";

type Props = {
    open: boolean;
    onClose: () => void;
    projectId: string;
    initialName: string;
    initialSummary: string;
    initialDescription: string;
    initialLinks: string[];
    initialIconImage: string;
    initialBannerImage: string;
    initialTimeline: {
        status: "In Progress" | "Complete";
        startDate: number | null;
        endDate: number | null;
    };
};

const MAX_LINKS = 3;

const EditHeaderModal = ({
    open,
    onClose,
    initialName,
    projectId,
    initialSummary,
    initialDescription,
    initialLinks,
    initialIconImage,
    initialBannerImage,
    initialTimeline,
}: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    // Step1–3 states
    const [name, setName] = useState(initialName);
    const [summary, setSummary] = useState(initialSummary);
    const [description, setDescription] = useState(initialDescription);
    const [projectLinks, setProjectLinks] = useState<string[]>(initialLinks);
    const [linkInput, setLinkInput] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);

    // Step4 states
    const [iconImage, setIconImage] = useState(initialIconImage);
    const [bannerImage, setBannerImage] = useState(initialBannerImage);

    // Step5 state
    const [timeline, setTimeline] = useState(initialTimeline);

    const handleSave = async () => {
        if (!name.trim() || !summary.trim()) {
            toast.error("Name and summary are required");
            return;
        }
        if (!description.trim()) {
            toast.error("Description is required");
            return;
        }
        if (!timeline.startDate) {
            toast.error("Start date is required");
            return;
        }
        if (
            timeline.status === "Complete" &&
            (!timeline.endDate || timeline.endDate < timeline.startDate)
        ) {
            toast.error("Valid end date is required for a completed project");
            return;
        }

        setIsPending(true);
        const { error } = await editProject(projectId, {
            name,
            summary,
            description,
            projectLinks,
            iconImage,
            bannerImage,
            status:
                timeline.status === "In Progress" ? "IN_PROGRESS" : "COMPLETE",
            startDate: new Date(timeline.startDate * 1000),
            endDate: timeline.endDate
                ? new Date(timeline.endDate * 1000)
                : null,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success("Project updated successfully.");
            router.refresh();
            onClose();
        }
        setIsPending(false);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Edit Project Header</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Step1 (Name and Summary) */}
                    <Step1
                        name={name}
                        setName={setName}
                        summary={summary}
                        setSummary={setSummary}
                    />

                    {/* Step2 (Description) */}
                    <Step2
                        description={description}
                        setDescription={setDescription}
                    />

                    {/* Step3 (Project Links) */}
                    <Step3
                        projectLinks={projectLinks}
                        linkInput={linkInput}
                        showLinkInput={showLinkInput}
                        onLinkInputChange={setLinkInput}
                        onAddLink={() => {
                            if (
                                linkInput.trim() &&
                                projectLinks.length < MAX_LINKS
                            ) {
                                setProjectLinks([
                                    ...projectLinks,
                                    linkInput.trim(),
                                ]);
                                setLinkInput("");
                                setShowLinkInput(false);
                            }
                        }}
                        onRemoveLink={(i) =>
                            setProjectLinks(
                                projectLinks.filter((_, idx) => idx !== i)
                            )
                        }
                        onToggleInput={() => setShowLinkInput((prev) => !prev)}
                    />

                    {/* Step4 (Icon & Banner) */}
                    <Step4
                        iconImageUrl={iconImage}
                        setIconImageUrl={setIconImage}
                        bannerImageUrl={bannerImage}
                        setBannerImageUrl={setBannerImage}
                    />

                    {/* Step5 (Status & Dates) */}
                    <Step5 onChange={setTimeline} initialValue={timeline} />
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="cursor-pointer"
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="cursor-pointer"
                        disabled={isPending}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditHeaderModal;
