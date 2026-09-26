"use client";

import ImageField from "@/components/general/photo-editor/ImageField";

type Props = {
    image: string;
    setImage: (url: string) => void;
};

const Step3 = ({ image, setImage }: Props) => {
    return (
        <ImageField
            label="Merit image"
            hint="A photo of your certificate, award or badge (optional)."
            value={image}
            onChange={setImage}
            aspect={16 / 9}
            folder="merits"
        />
    );
};

export default Step3;
