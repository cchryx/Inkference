"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";

type Props = {
    title: string;
    setTitle: (value: string) => void;
    issuer: string;
    setIssuer: (value: string) => void;
    meritType: string;
    setMeritType: (value: string) => void;
    summary: string;
    setSummary: (value: string) => void;
};

const meritTypeOptions = ["Honor / Award", "License / Certification"];

const Step1 = ({
    title,
    setTitle,
    issuer,
    setIssuer,
    meritType,
    setMeritType,
    summary,
    setSummary,
}: Props) => {
    const [meritTypeOpen, setMeritTypeOpen] = useState(false);

    const renderDropdown = (
        value: string,
        options: string[],
        isOpen: boolean,
        setOpen: (v: boolean) => void,
        onSelect: (val: string) => void
    ) => (
        <div className="relative w-full text-sm">
            <button
                type="button"
                onClick={() => setOpen(!isOpen)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border rounded-md flex justify-between items-center cursor-pointer"
            >
                {value || "Please select"}
                <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
            {isOpen && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white dark:bg-gray-800 text-sm shadow-md">
                    {options.map((opt) => (
                        <li
                            key={opt}
                            onMouseDown={() => {
                                onSelect(opt);
                                setOpen(false);
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <>
            {/* Title */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="title">Title</Label>
                    <InfoTooltip text="Name of the merit you've received. (max 60 chars)" />
                </div>
                <Input
                    id="title"
                    name="title"
                    value={title}
                    placeholder="Start typing title..."
                    onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                />
                <span className="text-xs text-gray-500">
                    {60 - title.length} characters left
                </span>
            </div>

            {/* Issuer */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="issuer">Issuer</Label>
                    <InfoTooltip text="Which organization is this merit associated with. (max 60 chars)" />
                </div>
                <Input
                    id="issuer"
                    name="issuer"
                    value={issuer}
                    placeholder="Start typing issuer..."
                    onChange={(e) => setIssuer(e.target.value.slice(0, 60))}
                />
                <span className="text-xs text-gray-500">
                    {60 - issuer.length} characters left
                </span>
            </div>

            {/* Merit Type (Custom Dropdown) */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="meritType">Merit Type</Label>
                    <InfoTooltip text="Select the type of merit: Honor/Award or License/Certification" />
                </div>
                {renderDropdown(
                    meritType,
                    meritTypeOptions,
                    meritTypeOpen,
                    setMeritTypeOpen,
                    setMeritType
                )}
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="summary">Summary</Label>
                    <InfoTooltip text="A brief one-line summary of this merit. (max 200 characters)" />
                </div>
                <Textarea
                    id="summary"
                    name="summary"
                    value={summary}
                    placeholder="Start typing summary..."
                    onChange={(e) => {
                        const value = e.target.value;
                        const lineCount = value.split("\n").length;
                        if (lineCount <= 1 && value.length <= 200) {
                            setSummary(value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                    }}
                    rows={2}
                    className="resize-none max-h-[8lh]"
                />
                <span className="text-xs text-gray-500">
                    {200 - summary.length} characters left
                </span>
            </div>
        </>
    );
};

export default Step1;
