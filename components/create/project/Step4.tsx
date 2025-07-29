"use client";

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/general/InfoToolTip";

type Props = {
    iconImageUrl: string;
    setIconImageUrl: (url: string) => void;
    bannerImageUrl: string;
    setBannerImageUrl: (url: string) => void;
};

const Step4 = ({
    iconImageUrl,
    setIconImageUrl,
    bannerImageUrl,
    setBannerImageUrl,
}: Props) => {
    return (
        <>
            {/* Icon Section */}
            <div className="flex flex-col gap-3 items-start">
                <div className="flex items-center gap-2">
                    <Label htmlFor="iconImage">Icon Image URL</Label>
                    <InfoTooltip
                        text="This will be your project’s icon. Paste a valid
                            image URL here."
                    />
                </div>
                <div className="flex gap-4 w-full">
                    <div className="size-24 rounded-md bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {iconImageUrl ? (
                            <img
                                src={iconImageUrl}
                                alt="Project Icon"
                                onError={() => setIconImageUrl("")}
                                className="size-24 rounded-md object-cover border border-gray-300"
                            />
                        ) : (
                            <span className="text-sm text-white">No Icon</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <Input
                            id="iconImage"
                            name="iconImage"
                            placeholder="https://example.com/icon.png"
                            value={iconImageUrl}
                            onChange={(e) => setIconImageUrl(e.target.value)}
                        />
                        {iconImageUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIconImageUrl("")}
                                className="w-fit text-xs px-2 py-1 h-auto cursor-pointer"
                            >
                                Remove Icon
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            <div className="flex flex-col gap-3 items-start">
                <div className="flex items-center gap-2">
                    <Label htmlFor="bannerImage">Banner Image URL</Label>
                    <InfoTooltip
                        text="Wide banner for the top of your project. Paste a
                            valid image URL here."
                    />
                </div>
                <div className="w-full">
                    {bannerImageUrl ? (
                        <img
                            src={bannerImageUrl}
                            alt="Project Banner"
                            onError={() => setBannerImageUrl("")}
                            className="lg:h-55 h-40 w-full rounded-md object-cover border border-gray-300"
                        />
                    ) : (
                        <div className="lg:h-55 h-40 w-full rounded-md bg-gray-700 text-white flex items-center justify-center text-sm text-gray-500">
                            No Banner Image
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 w-full">
                    <Input
                        id="bannerImage"
                        name="bannerImage"
                        placeholder="https://example.com/banner.jpg"
                        value={bannerImageUrl}
                        onChange={(e) => setBannerImageUrl(e.target.value)}
                    />
                    {bannerImageUrl && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBannerImageUrl("")}
                            className="w-fit text-xs px-2 py-1 h-auto cursor-pointer"
                        >
                            Remove Banner
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Step4;
