"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import InfoTooltip from "@/components/general/InfoToolTip";

type Props = {
    image: string;
    setImage: (url: string) => void;
};

const Step3 = ({ image, setImage }: Props) => {
    return (
        <>
            {/* Merit Image Section */}
            <div className="flex flex-col gap-3 items-start">
                <div className="flex items-center gap-2">
                    <Label htmlFor="image">Merit Image</Label>
                    <InfoTooltip text="This will be the image representing your merit. Paste a valid image URL here." />
                </div>
                <div className="w-full">
                    {image ? (
                        <img
                            src={image}
                            onError={() => setImage("")}
                            className="lg:h-120 h-40 w-full rounded-md object-cover border border-gray-300"
                        />
                    ) : (
                        <div className="lg:h-120 h-40 w-full rounded-md bg-gray-700 text-white flex items-center justify-center text-sm text-gray-500">
                            No Merit Image
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 w-full">
                    <Input
                        id="image"
                        name="image"
                        placeholder="https://example.com/merit.jpg"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                    />
                    {image && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImage("")}
                            className="w-fit text-xs px-2 py-1 h-auto cursor-pointer"
                        >
                            Remove Image
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Step3;
