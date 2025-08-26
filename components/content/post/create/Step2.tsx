"use client";

import { useEffect, useRef, useState } from "react";
import InfoTooltip from "@/components/general/InfoToolTip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { autocomplete } from "@/lib/googleMaps";

type Props = {
    description: string;
    setDescription: (value: string) => void;
    location: string;
    setLocation: (value: string) => void;
    locationSelected: boolean;
    setLocationSelected: (v: boolean) => void;
};

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

const Step2 = ({
    description,
    setDescription,
    location,
    setLocation,
    locationSelected,
    setLocationSelected,
}: Props) => {
    // Location state
    const [input, setInput] = useState(location ?? "");
    const [suggestions, setSuggestions] = useState<
        { description: string; place_id: string }[]
    >([]);
    const [focused, setFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClickOutside(wrapperRef, () => setSuggestions([]));

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

    return (
        <div className="flex flex-col gap-6">
            {/* Post Description */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="description">Post Description</Label>
                    <InfoTooltip text="A detailed description of your post. (max 2,200 chars, 10 lines)" />
                </div>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Start typing description..."
                    value={description}
                    onChange={(e) => {
                        const val = e.target.value;
                        const lines = val.split("\n").length;
                        if (lines <= 10 && val.length <= 2200) {
                            setDescription(val);
                        }
                    }}
                    rows={10}
                    className="resize-none max-h-[300px] overflow-y-auto"
                />
                <span className="text-xs text-gray-500">
                    {2200 - description.length} characters left
                </span>
            </div>

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
                            setLocation("");
                            setLocationSelected(false);
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
        </div>
    );
};

export default Step2;
