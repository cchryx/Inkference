"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import Step1 from "./project/Step1";
import Step2 from "./project/Step2";
import Step3 from "./project/Step3";
import Step4 from "./project/Step4";
import Step5 from "./project/Step5";
import Step6 from "./project/Step6";
import Preview from "./project/Preview";
import { toast } from "sonner";

type Props = {
    onCloseModal: () => void;
};

const MAX_LINKS = 3;
const MAX_RESOURCES = 20;

export default function CreateProjectModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = 7;

    // Step 1
    const [name, setName] = useState("");
    const [summary, setSummary] = useState("");

    // Step 2
    const [description, setDescription] = useState("");

    // Step 3
    const [projectLinks, setProjectLinks] = useState<string[]>([]);
    const [linkInput, setLinkInput] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);

    // Step 4
    const [iconImageUrl, setIconImageUrl] = useState("");
    const [bannerImageUrl, setBannerImageUrl] = useState("");

    // Step 5
    const [timeline, setTimeline] = useState({
        status: "In Progress" as "In Progress" | "Complete",
        startDate: null as number | null,
        endDate: null as number | null,
    });

    // Step 6
    const [projectResources, setProjectResources] = useState<string[]>([]);
    const [resourceInput, setResourceInput] = useState("");
    const [showResourceInput, setShowResourceInput] = useState(false);

    // Validations per step
    const handleNextClick = () => {
        switch (step) {
            case 0:
                if (!name.trim() || !summary.trim()) {
                    toast.error("Name and summary are required.");
                    return;
                }
                break;
            case 1:
                if (!description.trim()) {
                    toast.error("Description is required.");
                    return;
                }
                break;
            case 4:
                if (
                    !timeline.startDate ||
                    (timeline.status === "Complete" && !timeline.endDate)
                ) {
                    toast.error("Valid start and end dates are required.");
                    return;
                } else if (
                    timeline.status === "Complete" &&
                    timeline.endDate &&
                    timeline.endDate < timeline.startDate
                ) {
                    toast.error("End date can't be before the start date.");
                    return;
                }
                break;
        }
        if (step < totalSteps - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === totalSteps - 1) {
            console.log("Submitting project:", {
                name,
                summary,
                description,
                projectLinks,
                iconImageUrl,
                bannerImageUrl,
                timeline,
                projectResources,
            });
            onCloseModal();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl w-full md:w-[70%] lg:w-[40%] shadow-lg flex flex-col max-h-[90vh]">
                {/* Top Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Create Project</h2>
                    <button
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Middle Scrollable Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                >
                    {step === 0 && (
                        <Step1
                            name={name}
                            setName={setName}
                            summary={summary}
                            setSummary={setSummary}
                        />
                    )}
                    {step === 1 && (
                        <Step2
                            description={description}
                            setDescription={setDescription}
                        />
                    )}
                    {step === 2 && (
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
                            onToggleInput={() => setShowLinkInput((p) => !p)}
                        />
                    )}
                    {step === 3 && (
                        <Step4
                            iconImageUrl={iconImageUrl}
                            setIconImageUrl={setIconImageUrl}
                            bannerImageUrl={bannerImageUrl}
                            setBannerImageUrl={setBannerImageUrl}
                        />
                    )}
                    {step === 4 && (
                        <Step5 onChange={setTimeline} initialValue={timeline} />
                    )}
                    {step === 5 && (
                        <Step6
                            projectResources={projectResources}
                            resourceInput={resourceInput}
                            showResourceInput={showResourceInput}
                            onLinkInputChange={setResourceInput}
                            onAddLink={() => {
                                if (
                                    resourceInput.trim() &&
                                    projectResources.length < MAX_RESOURCES
                                ) {
                                    setProjectResources([
                                        ...projectResources,
                                        resourceInput.trim(),
                                    ]);
                                    setResourceInput("");
                                    setShowResourceInput(false);
                                }
                            }}
                            onRemoveLink={(i) =>
                                setProjectResources(
                                    projectResources.filter(
                                        (_, idx) => idx !== i
                                    )
                                )
                            }
                            onToggleInput={() =>
                                setShowResourceInput((p) => !p)
                            }
                        />
                    )}
                    {step === 6 && (
                        <Preview
                            name={name}
                            summary={summary}
                            description={description}
                            projectLinks={projectLinks}
                            iconImageUrl={iconImageUrl}
                            bannerImageUrl={bannerImageUrl}
                            timeline={timeline}
                            projectResources={projectResources}
                        />
                    )}
                </form>

                {/* Bottom Navigation */}
                <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl">
                    <Button
                        onClick={handleBack}
                        disabled={step === 0}
                        className="cursor-pointer"
                    >
                        Back
                    </Button>
                    <div className="flex gap-2 items-center">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`size-2 rounded-full ${
                                    step === i
                                        ? "bg-black size-3"
                                        : "bg-gray-400"
                                }`}
                            />
                        ))}
                    </div>
                    {step === totalSteps - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            type="submit"
                            className="cursor-pointer"
                        >
                            Create Project
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleNextClick}
                            className="cursor-pointer"
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
