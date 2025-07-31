"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Link2, X } from "lucide-react";
import InfoTooltip from "@/components/general/InfoToolTip";

type Step6Props = {
    projectResources: string[];
    resourceInput: string;
    showResourceInput: boolean;
    onLinkInputChange: (value: string) => void;
    onAddLink: () => void;
    onRemoveLink: (index: number) => void;
    onToggleInput: () => void;
};

const MAX_RESOURCES = 20;

const Step6 = ({
    projectResources,
    resourceInput,
    showResourceInput,
    onLinkInputChange,
    onAddLink,
    onRemoveLink,
    onToggleInput,
}: Step6Props) => {
    const maxResourcesReached = projectResources.length >= MAX_RESOURCES;
    const isResourceValid = resourceInput.trim().length > 0;

    // Determine if we need scroll container (after 8 items)
    const shouldScroll = projectResources.length > 8;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <Label htmlFor="projectResources" className="text-lg">
                    Project Resources
                </Label>
                <InfoTooltip text="Add up to 20 links related to your project." />
            </div>

            {/* Scroll container only if more than 8 */}
            <div
                className={`${
                    shouldScroll ? "max-h-[256px] overflow-y-auto" : ""
                } space-y-1`}
            >
                {projectResources.map((resource, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-sm"
                    >
                        <span className="flex items-center gap-2 max-w-full overflow-hidden">
                            <Link2 className="w-4 h-4 shrink-0" />
                            <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                {resource}
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
            </div>

            {showResourceInput && !maxResourcesReached && (
                <div className="flex items-center gap-2 mt-1">
                    <Input
                        value={resourceInput}
                        onChange={(e) => onLinkInputChange(e.target.value)}
                        placeholder="Enter resource link"
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onAddLink}
                        disabled={!isResourceValid}
                        className="cursor-pointer"
                    >
                        Add
                    </Button>
                </div>
            )}

            {!showResourceInput && !maxResourcesReached && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onToggleInput}
                    className="w-fit text-xs px-2 py-1 h-auto mt-1 cursor-pointer"
                >
                    + Add Resource
                </Button>
            )}

            <span className="text-xs text-gray-500 mt-1">
                You can add up to {MAX_RESOURCES} links.{" "}
                {MAX_RESOURCES - projectResources.length} left.
            </span>
        </div>
    );
};

export default Step6;
