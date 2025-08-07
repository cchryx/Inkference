"use client";

import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";

type Props = {
    title: string;
    setTitle: (value: string) => void;
    organization: string;
    setOrganization: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
};

const Step1 = ({
    title,
    setTitle,
    organization,
    setOrganization,
    description,
    setDescription,
}: Props) => {
    return (
        <>
            {/* Experience Title */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="title">Experience Title</Label>
                    <InfoTooltip text="Title of the experience. Like your job title. (max 60 chars)" />
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

            {/* Experience Organization */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="organization">
                        Experience Organization
                    </Label>
                    <InfoTooltip text="Is there an organization that is providing this experience. (max 60 chars)" />
                </div>
                <Input
                    id="organization"
                    name="organization"
                    value={organization}
                    placeholder="Start typing organization..."
                    onChange={(e) =>
                        setOrganization(e.target.value.slice(0, 60))
                    }
                />
                <span className="text-xs text-gray-500">
                    {60 - organization.length} characters left
                </span>
            </div>

            {/* Experience Description */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="description">Experience Description</Label>
                    <InfoTooltip
                        text="A brief description of your experience. What did you do? (max 150 chars,
                            1 line)"
                    />
                </div>
                <Textarea
                    id="description"
                    name="description"
                    value={description}
                    placeholder="Start typing description..."
                    onChange={(e) => {
                        const value = e.target.value;
                        const lineCount = value.split("\n").length;
                        if (lineCount <= 1 && value.length <= 150) {
                            setDescription(value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                    }}
                    rows={2}
                    className="resize-none max-h-[8lh]"
                />
                <span className="text-xs text-gray-500">
                    {150 - description.length} characters left
                </span>
            </div>
        </>
    );
};

export default Step1;
