"use client";

import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";

type Props = {
    activitiesAndSocieties: string;
    setActivitiesAndSocieties: (value: string) => void;
};

const Step3 = ({
    activitiesAndSocieties,
    setActivitiesAndSocieties,
}: Props) => {
    return (
        <>
            {/* Activities and Societies */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="activitiesAndSocieties">
                        Activities and Societies
                    </Label>
                    <InfoTooltip text="Clubs, sports, or societies you participated in. (max 300 characters, 1 line)" />
                </div>
                <Textarea
                    id="activitiesAndSocieties"
                    name="activitiesAndSocieties"
                    value={activitiesAndSocieties}
                    placeholder="Start typing activities and societies..."
                    onChange={(e) => {
                        const value = e.target.value;
                        const lineCount = value.split("\n").length;
                        if (lineCount <= 1 && value.length <= 300) {
                            setActivitiesAndSocieties(value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault(); // Prevent line breaks
                    }}
                    rows={2}
                    className="resize-none max-h-[8lh]"
                />
                <span className="text-xs text-gray-500">
                    {150 - activitiesAndSocieties.length} characters left
                </span>
            </div>
        </>
    );
};

export default Step3;
