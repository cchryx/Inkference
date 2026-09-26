"use client";

import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Preview from "./Preview";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { useRouter } from "next/navigation";
import { addMerit } from "@/actions/content/merit/addMerit";
import { commitStaged, release } from "@/lib/pendingUploads";

const STEP_NAMES = ["Details", "Dates", "Image", "Preview"];

type Props = {
    onCloseModal: () => void;
};


export default function AddMeritModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = STEP_NAMES.length;

    // Step 1
    const [title, setTitle] = useState("");
    const [issuer, setIssuer] = useState("");
    const [meritType, setMeritType] = useState("");
    const [summary, setSummary] = useState("");

    // Step 2
    const [timeline, setTimeline] = useState({
        issueDate: null as number | null,
        expiryDate: null as number | null,
    });

    // Step 3
    const [image, setImage] = useState("");

    // General Mechanics
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const handleNextClick = () => {
        switch (step) {
            case 0:
                if (!title.trim()) {
                    toast.error("Title is required.");
                    return;
                } else if (!issuer.trim()) {
                    toast.error("Issuer is required.");
                    return;
                } else if (!meritType.trim()) {
                    toast.error("Merit type is required.");
                    return;
                }
                break;
            case 1:
                if (!timeline.issueDate) {
                    toast.error("Valid issue date is required.");
                    return;
                } else if (
                    timeline.expiryDate &&
                    timeline.expiryDate < timeline.issueDate
                ) {
                    toast.error("Expiry date can't be before the issue date.");
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
                // The picture is only uploaded now, when the merit is saved.
                const images = await commitStaged([image]);
                if (images.error !== undefined) {
                    toast.error(images.error);
                    setIsPending(false);
                    return;
                }
                const result = await addMerit({
                    title,
                    issuer,
                    meritType,
                    summary,
                    timeline,
                    image: images.urls[0],
                });

                if ("error" in result) {
                    toast.error(result.error);
                } else {
                    release([image]);
                    toast.success("Merit added successfully.");
                    onCloseModal();
                    router.refresh();
                }
            } catch (error) {
                toast.error("Failed to add merit.");
                console.error(error);
            }
        }
        setIsPending(false);
    };

    return (
        <StepModal
            title="Add merit"
            steps={STEP_NAMES}
            step={step}
            onClose={onCloseModal}
            dirty={!!(title.trim() || issuer.trim() || summary.trim())}
            onBack={handleBack}
            onNext={handleNextClick}
            onSubmit={handleSubmit}
            submitLabel="Add merit"
            pendingLabel="Saving"
            pending={isPending}
        >
            {step === 0 && (
                <Step1
                    title={title}
                    setTitle={setTitle}
                    issuer={issuer}
                    setIssuer={setIssuer}
                    meritType={meritType}
                    setMeritType={setMeritType}
                    summary={summary}
                    setSummary={setSummary}
                />
            )}
            {step === 1 && (
                <Step2 onChange={setTimeline} initialValue={timeline} />
            )}
            {step === 2 && <Step3 image={image} setImage={setImage} />}
            {step === 3 && (
                <Preview
                    title={title}
                    issuer={issuer}
                    meritType={meritType}
                    summary={summary}
                    timeline={timeline}
                    image={image}
                />
            )}
        </StepModal>
    );
}
