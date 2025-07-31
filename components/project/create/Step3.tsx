"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Link2, X } from "lucide-react";
import InfoTooltip from "@/components/general/InfoToolTip";

type Step3 = {
    projectLinks: string[];
    linkInput: string;
    showLinkInput: boolean;
    onLinkInputChange: (value: string) => void;
    onAddLink: () => void;
    onRemoveLink: (index: number) => void;
    onToggleInput: () => void;
};

const MAX_LINKS = 3;

export default function Step3({
    projectLinks,
    linkInput,
    showLinkInput,
    onLinkInputChange,
    onAddLink,
    onRemoveLink,
    onToggleInput,
}: Step3) {
    const maxLinksReached = projectLinks.length >= MAX_LINKS;
    const isLinkValid = linkInput.trim().length > 0;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <Label htmlFor="projectLinks" className="text-lg">
                    Project Links
                </Label>
                <InfoTooltip text="Add up to 3 links related to your project." />
            </div>

            {projectLinks.map((link, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-sm"
                >
                    <span className="flex items-center gap-2 max-w-full overflow-hidden">
                        <Link2 className="w-4 h-4 shrink-0" />
                        <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                            {link}
                        </p>
                    </span>
                    <button
                        type="button"
                        onClick={() => onRemoveLink(index)}
                        className="ml-2 text-gray-400 hover:text-red-500 cursor-pointer transition-all duration-200 hover:rotate-90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}

            {showLinkInput && !maxLinksReached && (
                <div className="flex items-center gap-2 mt-1">
                    <Input
                        value={linkInput}
                        onChange={(e) => onLinkInputChange(e.target.value)}
                        placeholder="Enter project link"
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onAddLink}
                        disabled={!isLinkValid}
                        className="cursor-pointer"
                    >
                        Add
                    </Button>
                </div>
            )}

            {!showLinkInput && !maxLinksReached && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onToggleInput}
                    className="w-fit text-xs px-2 py-1 h-auto mt-1 cursor-pointer"
                >
                    + Add Link
                </Button>
            )}

            <span className="text-xs text-gray-500 mt-1">
                You can add up to {MAX_LINKS} links.{" "}
                {MAX_LINKS - projectLinks.length} left.
            </span>
        </div>
    );
}
