"use client";

import { InfoTooltip } from "@/components/general/InfoToolTip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";

type Props = {
    description: string;
    setDescription: (value: string) => void;
};

const Step2 = ({ description, setDescription }: Props) => {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <Label htmlFor="description">Project Description</Label>
                <InfoTooltip text="A detailed description of your project. (max 1,300 chars, 10 lines)" />
            </div>
            <Textarea
                id="description"
                name="description"
                placeholder="Start typing description..."
                value={description}
                onChange={(e) => {
                    const val = e.target.value;
                    const lines = val.split("\n").length;
                    if (lines <= 10 && val.length <= 1300) {
                        setDescription(val);
                    }
                }}
                rows={10}
                className="resize-none max-h-[300px] overflow-y-auto"
            />
            <span className="text-xs text-gray-500">
                {1300 - description.length} characters left
            </span>
        </div>
    );
};

export default Step2;
