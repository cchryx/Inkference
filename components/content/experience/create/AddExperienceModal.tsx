"use client";

import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Preview from "./Preview";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { useRouter } from "next/navigation";
import { addExperience } from "@/actions/content/experience/addExperience";

const STEP_NAMES = ["The basics", "Timeline", "Location and type", "Preview"];

type Props = {
    onCloseModal: () => void;
};


export default function AddExperienceModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = STEP_NAMES.length;

    // Step 1
    const [title, setTitle] = useState("");
    const [organization, setOrganization] = useState("");
    const [description, setDescription] = useState("");

    // Step 2
    const [timeline, setTimeline] = useState({
        status: "Ongoing" as "Ongoing" | "Complete",
        startDate: null as number | null,
        endDate: null as number | null,
    });

    // Step 3
    const [location, setLocation] = useState("");
    const [locationSelected, setLocationSelected] = useState(false);
    const [locationType, setLocationType] = useState("");
    const [employmentType, setEmploymentType] = useState("");

    // General Mechanics
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const handleNextClick = () => {
        switch (step) {
            case 0:
                if (!title.trim() || !description.trim()) {
                    toast.error("Title and description are required.");
                    return;
                }
                break;
            case 1:
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
            case 2:
                if (!locationSelected) {
                    toast.error("Please select a location from suggestions.");
                    return;
                } else if (!locationType || !employmentType) {
                    toast.error(
                        "Location type and employment type are required."
                    );
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
                const result = await addExperience({
                    title,
                    description,
                    organization,
                    location,
                    locationType,
                    employmentType,
                    status:
                        timeline.status === "Ongoing" ? "Ongoing" : "Complete",
                    startDate: timeline.startDate!,
                    endDate:
                        timeline.status === "Complete"
                            ? timeline.endDate ?? null
                            : null,
                });

                if ("error" in result) {
                    toast.error(result.error);
                } else {
                    toast.success("Experience added successfully.");
                    onCloseModal();
                    router.refresh();
                }
            } catch (error) {
                toast.error("Failed to add experience.");
                console.error(error);
            }
        }

        setIsPending(false);
    };

    return (
        <StepModal
            title="Add experience"
            steps={STEP_NAMES}
            step={step}
            onClose={onCloseModal}
            dirty={!!(title.trim() || organization.trim() || description.trim())}
            onBack={handleBack}
            onNext={handleNextClick}
            onSubmit={handleSubmit}
            submitLabel="Add experience"
            pendingLabel="Saving"
            pending={isPending}
        >
            {step === 0 && (
                <Step1
                    title={title}
                    setTitle={setTitle}
                    organization={organization}
                    setOrganization={setOrganization}
                    description={description}
                    setDescription={setDescription}
                />
            )}
            {step === 1 && (
                <Step2 onChange={setTimeline} initialValue={timeline} />
            )}
            {step === 2 && (
                <Step3
                    location={location}
                    setLocation={setLocation}
                    locationSelected={locationSelected}
                    setLocationSelected={setLocationSelected}
                    locationType={locationType}
                    setLocationType={setLocationType}
                    employmentType={employmentType}
                    setEmploymentType={setEmploymentType}
                />
            )}
            {step === 3 && (
                <Preview
                    title={title}
                    organization={organization}
                    description={description}
                    timeline={timeline}
                    location={location}
                    employmentType={employmentType}
                    locationType={locationType}
                />
            )}
        </StepModal>
    );
}
