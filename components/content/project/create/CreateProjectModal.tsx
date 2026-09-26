"use client";

import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import Step6 from "./Step6";
import Preview from "./Preview";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { createProject } from "@/actions/content/project/createProject";
import { useRouter } from "next/navigation";

const STEP_NAMES = ["Name and summary", "Description", "Links", "Images", "Timeline", "Resources", "Preview"];

type Props = {
    onCloseModal: () => void;
};

const MAX_LINKS = 3;
const MAX_RESOURCES = 20;

export default function CreateProjectModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = STEP_NAMES.length;

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

    // General Mechanics
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
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

    const handleSubmit = async () => {
        setIsPending(true);

        if (step === totalSteps - 1) {
            try {
                const result = await createProject({
                    name,
                    summary,
                    description,
                    projectLinks,
                    iconImageUrl,
                    bannerImageUrl,
                    projectResources,
                    status:
                        timeline.status === "In Progress"
                            ? "IN_PROGRESS"
                            : "COMPLETE",
                    startDate: timeline.startDate!,
                    endDate:
                        timeline.status === "Complete"
                            ? timeline.endDate ?? null
                            : null,
                    skills: [],
                    contributorIds: [], // pass actual contributor IDs if you have them
                });

                if ("error" in result) {
                    toast.error(result.error);
                } else {
                    toast.success("Project created successfully.");
                    onCloseModal();
                    router.refresh();
                }
            } catch (error) {
                toast.error("Failed to create project.");
                console.error(error);
            }
        }
        setIsPending(false);
    };

    return (
        <StepModal
            title="Create project"
            steps={STEP_NAMES}
            step={step}
            onClose={onCloseModal}
            dirty={!!(name.trim() || summary.trim() || description.trim())}
            onBack={handleBack}
            onNext={handleNextClick}
            onSubmit={handleSubmit}
            submitLabel="Create project"
            pendingLabel="Saving"
            pending={isPending}
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
        </StepModal>
    );
}
