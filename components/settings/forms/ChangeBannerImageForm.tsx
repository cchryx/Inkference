"use client";

import { changeProfileAction } from "@/actions/profile/changeProfile";
import ImageSettingForm from "./ImageSettingForm";

type Props = {
    bannerImage: string | undefined;
    isLoading?: boolean;
};

const saveBanner = (url: string) => {
    const formData = new FormData();
    formData.set("bannerImage", url);
    return changeProfileAction(formData, "bannerImage");
};

const ChangeBannerImageForm = ({ bannerImage, isLoading }: Props) => (
    <ImageSettingForm
        title="Banner"
        noun="banner"
        value={bannerImage}
        isLoading={isLoading}
        statusKey="bannerImage"
        aspect={3}
        variant="wide"
        save={saveBanner}
    />
);

export default ChangeBannerImageForm;
