"use client";

import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Preview from "./Preview";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { useRouter } from "next/navigation";
import { addEducation } from "@/actions/content/education/addEducation";

const STEP_NAMES = ["School", "Timeline", "Activities", "Preview"];

type Props = {
    onCloseModal: () => void;
};


export default function AddEducationModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = STEP_NAMES.length;

    // Step 1
    const [school, setSchool] = useState("");
    const [degree, setDegree] = useState("");
    const [fieldOfStudy, setFieldOfStudy] = useState("");

    // Step 2
    const [timeline, setTimeline] = useState({
        startDate: null as number | null,
        endDate: null as number | null,
    });

    // Step 3
    const [activitiesAndSocieties, setActivitiesAndSocieties] = useState("");

    // General Mechanics
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const handleNextClick = () => {
        switch (step) {
            case 0:
                if (!school.trim()) {
                    toast.error("School is required.");
                    return;
                }
                break;
            case 1:
                if (!timeline.startDate || !timeline.endDate) {
                    toast.error("Valid start and end dates are required.");
                    return;
                } else if (
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
                const result = await addEducation({
                    school,
                    degree,
                    fieldOfStudy,
                    activitiesAndSocieties,
                    startDate: timeline.startDate!,
                    endDate: timeline.endDate!,
                });

                if ("error" in result) {
                    toast.error(result.error);
                } else {
                    toast.success("Experience added successfully.");
                    onCloseModal();
                    router.refresh();
                }
            } catch (error) {
                toast.error("Failed to add education.");
                console.error(error);
            }
        }
        setIsPending(false);
    };

    return (
        <StepModal
            title="Add education"
            steps={STEP_NAMES}
            step={step}
            onClose={onCloseModal}
            dirty={!!(school.trim() || degree.trim() || fieldOfStudy.trim())}
            onBack={handleBack}
            onNext={handleNextClick}
            onSubmit={handleSubmit}
            submitLabel="Add education"
            pendingLabel="Saving"
            pending={isPending}
        >
            {step === 0 && (
                <Step1
                    school={school}
                    setSchool={setSchool}
                    degree={degree}
                    setDegree={setDegree}
                    fieldOfStudy={fieldOfStudy}
                    setFieldOfStudy={setFieldOfStudy}
                />
            )}
            {step === 1 && (
                <Step2 onChange={setTimeline} initialValue={timeline} />
            )}
            {step === 2 && (
                <Step3
                    activitiesAndSocieties={activitiesAndSocieties}
                    setActivitiesAndSocieties={
                        setActivitiesAndSocieties
                    }
                />
            )}
            {step === 3 && (
                <Preview
                    school={school}
                    degree={degree}
                    fieldOfStudy={fieldOfStudy}
                    timeline={timeline}
                    activitiesAndSocieties={activitiesAndSocieties}
                />
            )}
        </StepModal>
    );
}
