"use client";

import { changeUserAction } from "@/actions/auth/changeUser";
import ImageSettingForm from "./ImageSettingForm";

type Props = {
    profileImage: string | undefined;
    isLoading?: boolean;
};

const saveImage = (url: string) => {
    const formData = new FormData();
    formData.set("image", url);
    return changeUserAction(formData, "image");
};

const ChangeProfileImageForm = ({ profileImage, isLoading }: Props) => (
    <ImageSettingForm
        title="Profile picture"
        noun="profile picture"
        value={profileImage}
        isLoading={isLoading}
        statusKey="image"
        aspect={1}
        variant="icon"
        save={saveImage}
    />
);

export default ChangeProfileImageForm;
