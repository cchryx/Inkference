"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autocomplete } from "@/lib/googleMaps";

type Props = {
    location: string;
    setLocation: (value: string) => void;
    locationSelected: boolean;
    setLocationSelected: (v: boolean) => void;
    locationType: string;
    setLocationType: (value: string) => void;
    employmentType: string;
    setEmploymentType: (value: string) => void;
};

const employmentOptions = [
    "Self-employed",
    "Freelance",
    "Internship",
    "Apprenticeship",
    "Contract Full-time",
    "Permanent Part-time",
    "Contract Part-time",
    "Casual / On-call",
    "Seasonal",
    "Permanent Full-time",
    "Co-op",
];

const locationTypeOptions = ["On-site", "Hybrid", "Remote"];

function useClickOutside(
    ref: React.RefObject<HTMLElement | null>,
    handler: () => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            const el = ref.current;
            if (!el || el.contains(event.target as Node)) return;
            handler();
        };
        document.addEventListener("mousedown", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
        };
    }, [ref, handler]);
}

const Step3 = ({
    location,
    setLocation,
    locationSelected,
    setLocationSelected,
    locationType,
    setLocationType,
    employmentType,
    setEmploymentType,
}: Props) => {
    const [input, setInput] = useState(location ?? "");
    const [suggestions, setSuggestions] = useState<
        { description: string; place_id: string }[]
    >([]);
    const [focused, setFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [locationTypeOpen, setLocationTypeOpen] = useState(false);
    const [employmentTypeOpen, setEmploymentTypeOpen] = useState(false);

    useClickOutside(wrapperRef, () => {
        setSuggestions([]);
    });

    useEffect(() => {
        if (input === location || !input) {
            setSuggestions([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            const results = await autocomplete(input);
            const simplified = results.map((r: any) => ({
                description: r.formatted_address || r.name,
                place_id: r.place_id,
            }));
            setSuggestions(simplified);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [input, location]);

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
        <div className="flex flex-col gap-6">
            {/* Location Input (with Autocomplete) */}
            <div className="flex flex-col gap-1" ref={wrapperRef}>
                <div className="flex items-center gap-1">
                    <Label htmlFor="location">Location</Label>
                    <InfoTooltip text="Enter the city or place. Suggestions powered by Google Maps." />
                </div>
                <div className="relative">
                    <Input
                        id="location"
                        name="location"
                        value={input}
                        placeholder="Start typing a location..."
                        onChange={(e) => {
                            setInput(e.target.value);
                            setLocation(""); // Clear
                            setLocationSelected(false); // Not selected yet
                        }}
                        onFocus={() => setFocused(true)}
                        autoComplete="off"
                    />
                    {focused && suggestions.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-48 overflow-y-auto z-20 text-sm">
                            {suggestions.map((s) => (
                                <li
                                    key={s.place_id}
                                    className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onMouseDown={() => {
                                        setInput(s.description);
                                        setLocation(s.description);
                                        setSuggestions([]);
                                        setLocationSelected(true);
                                    }}
                                >
                                    {s.description}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Location Type Dropdown */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="locationType">Location Type</Label>
                    <InfoTooltip text="Choose where the job was performed." />
                </div>
                {renderDropdown(
                    locationType,
                    locationTypeOptions,
                    locationTypeOpen,
                    setLocationTypeOpen,
                    setLocationType
                )}
            </div>

            {/* Employment Type Dropdown */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <InfoTooltip text="Select the type of employment for this role." />
                </div>
                {renderDropdown(
                    employmentType,
                    employmentOptions,
                    employmentTypeOpen,
                    setEmploymentTypeOpen,
                    setEmploymentType
                )}
            </div>
        </div>
    );
};

export default Step3;
