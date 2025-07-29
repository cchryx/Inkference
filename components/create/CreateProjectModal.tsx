"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import Step1 from "./project/Step1";
import Step2 from "./project/Step2";
import Step3 from "./project/Step3";
import Step4 from "./project/Step4";
import Step5 from "./project/Step5";
import Step6 from "./project/Step6";

type Props = {
    onCloseModal: () => void;
};

const MAX_LINKS = 3;

export default function CreateProjectModal({ onCloseModal }: Props) {
    //////////////////// STEPS IN THE FORM ////////////////////
    // Step 1
    const [name, setName] = useState("");
    const [summary, setSummary] = useState("");

    // Step 2
    const [description, setDescription] = useState("");

    // Step 3
    const [projectLinks, setProjectLinks] = useState<string[]>([]);
    const [linkInput, setLinkInput] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);
    const isLinkValid = linkInput.trim().length > 0;
    const maxLinksReached = projectLinks.length >= MAX_LINKS;
    const handleAddLink = () => {
        if (!isLinkValid || maxLinksReached) return;
        const newLinks = [...projectLinks, linkInput.trim()];
        setProjectLinks(newLinks);
        setLinkInput("");
        setShowLinkInput(false);
    };
    const handleRemoveLink = (index: number) => {
        const newLinks = projectLinks.filter((_, i) => i !== index);
        setProjectLinks(newLinks);
    };

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
    const isResourceValid = resourceInput.trim().length > 0;
    const maxResourcesReached = projectResources.length >= MAX_LINKS;
    const handleAddResource = () => {
        if (!isResourceValid || maxResourcesReached) return;
        const newResources = [...projectResources, resourceInput.trim()];
        setProjectResources(newResources);
        setResourceInput("");
        setShowResourceInput(false);
    };
    const handleRemoveResource = (index: number) => {
        const newResources = projectResources.filter((_, i) => i !== index);
        setProjectResources(newResources);
    };

    //////////////////// GENERAL FORM MECHANICS ////////////////////
    const [step, setStep] = useState(0);
    const totalSteps = 6;

    const nextStep = () => {
        if (step < totalSteps - 1) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === totalSteps - 1) {
            console.log("Form submitted!", { name, summary, projectLinks });
            if (step === totalSteps - 1) {
                console.log("Form submitted!", {
                    name,
                    summary,
                    projectLinks,
                    iconImageUrl,
                    bannerImageUrl,
                    timeline,
                    projectResources,
                });
                onCloseModal();
            } else {
                nextStep();
            }
        } else {
            nextStep();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl p-5 w-full md:w-[70%] lg:w-[40%] shadow-lg relative">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold">Create Project</h2>
                    <button
                        onClick={onCloseModal}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator Dots */}
                <div className="flex justify-center gap-2 my-6">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                                i === step ? "bg-black" : "bg-gray-400"
                            }`}
                        />
                    ))}
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {step === 0 && (
                        <>
                            <Step1
                                name={name}
                                setName={setName}
                                summary={summary}
                                setSummary={setSummary}
                            />
                        </>
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
                            onAddLink={handleAddLink}
                            onRemoveLink={handleRemoveLink}
                            onToggleInput={() =>
                                setShowLinkInput((prev) => !prev)
                            }
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
                        <Step5
                            onChange={setTimeline}
                            initialValue={{
                                status: timeline.status,
                                startDate: timeline.startDate,
                                endDate: timeline.endDate,
                            }}
                        />
                    )}

                    {step === 5 && (
                        <Step6
                            projectResources={projectResources}
                            resourceInput={resourceInput}
                            showResourceInput={showResourceInput}
                            onLinkInputChange={setResourceInput}
                            onAddLink={handleAddResource}
                            onRemoveLink={handleRemoveResource}
                            onToggleInput={() =>
                                setShowResourceInput((prev) => !prev)
                            }
                        />
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-4">
                        <Button
                            type="button"
                            onClick={prevStep}
                            className="cursor-pointer"
                            disabled={step === 0}
                        >
                            Back
                        </Button>
                        <Button type="submit" className="cursor-pointer">
                            {step < totalSteps - 1 ? "Next" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
