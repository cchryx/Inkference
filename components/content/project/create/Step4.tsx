"use client";

import ImageField from "@/components/general/photo-editor/ImageField";

type Props = {
    iconImageUrl: string;
    setIconImageUrl: (url: string) => void;
    bannerImageUrl: string;
    setBannerImageUrl: (url: string) => void;
};

const Step4 = ({ iconImageUrl, setIconImageUrl, bannerImageUrl, setBannerImageUrl }: Props) => {
    return (
        <div className="flex flex-col gap-6">
            <ImageField
                label="Icon"
                hint="A square logo or image for your project."
                value={iconImageUrl}
                onChange={setIconImageUrl}
                aspect={1}
                folder="projects"
                variant="icon"
            />
            <ImageField
                label="Banner"
                hint="A wide image shown across the top of your project page."
                value={bannerImageUrl}
                onChange={setBannerImageUrl}
                aspect={3}
                folder="projects"
            />
        </div>
    );
};

export default Step4;
