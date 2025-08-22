"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Preview from "./Preview";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { addMerit } from "@/actions/content/merit/addMerit";

type Props = {
    onCloseModal: () => void;
};

const MAX_LINKS = 3;
const MAX_RESOURCES = 20;

export default function AddMeritModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = 4;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        if (step === totalSteps - 1) {
            try {
                const result = await addMerit({
                    title,
                    issuer,
                    meritType,
                    summary,
                    timeline,
                    image,
                });

                if ("error" in result) {
                    toast.error(result.error);
                } else {
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl shadow-lg flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw]">
                {/* Top Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Add Merit</h2>
                    <button
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Middle Scrollable Content */}
                <form
                    // onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
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
                </form>

                {/* Bottom Navigation */}
                <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl">
                    <Button
                        onClick={handleBack}
                        disabled={step === 0 || isPending}
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
                            disabled={isPending}
                        >
                            Add Merit
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleNextClick}
                            className="cursor-pointer"
                            disabled={isPending}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
