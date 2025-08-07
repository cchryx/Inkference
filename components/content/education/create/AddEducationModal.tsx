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
import { addEducation } from "@/actions/content/education/addEducation";

type Props = {
    onCloseModal: () => void;
};

const MAX_LINKS = 3;
const MAX_RESOURCES = 20;

export default function AddEducationModal({ onCloseModal }: Props) {
    // Step states
    const [step, setStep] = useState(0);
    const totalSteps = 4;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                toast.error("Failed to add experience.");
                console.error(error);
            }
        }
        setIsPending(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl w-full md:w-[70%] lg:w-[50%] shadow-lg flex flex-col max-h-[90vh]">
                {/* Top Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Add Education</h2>
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
                            Add Education
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
