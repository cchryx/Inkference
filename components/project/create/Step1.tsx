"use client";

import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";

type Props = {
    name: string;
    setName: (value: string) => void;
    summary: string;
    setSummary: (value: string) => void;
};

const Step1 = ({ name, setName, summary, setSummary }: Props) => {
    return (
        <>
            {/* Project Name */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="name">Project Name</Label>
                    <InfoTooltip text="Short, clear title. (max 60 chars)" />
                </div>
                <Input
                    id="name"
                    name="name"
                    value={name}
                    placeholder="Start typing name..."
                    onChange={(e) => setName(e.target.value.slice(0, 60))}
                />
                <span className="text-xs text-gray-500">
                    {60 - name.length} characters left
                </span>
            </div>

            {/* Project Summary */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="summary">Project Summary</Label>
                    <InfoTooltip
                        text="A brief description of your project. (max 150 chars,
                            1 line)"
                    />
                </div>
                <Textarea
                    id="summary"
                    name="summary"
                    value={summary}
                    placeholder="Start typing summary..."
                    onChange={(e) => {
                        const value = e.target.value;
                        const lineCount = value.split("\n").length;
                        if (lineCount <= 1 && value.length <= 150) {
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
                    {150 - summary.length} characters left
                </span>
            </div>
        </>
    );
};

export default Step1;
