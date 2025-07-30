"use client";

import { useEffect, useState } from "react";
import { getProfileData } from "@/actions/profile/getProfileData";
import ChangeBioForm from "./forms/ChangeBioForm";
import ChangeBirthdate from "./forms/ChangeBirthdate";
import ChangeAddressForm from "./forms/ChangeAddressForm";
import ChangeNameForm from "./forms/ChangeNameForm";
import ChangeUsernameForm from "./forms/ChangeUsernameForm";
import { toast } from "sonner";
import ChangeSocialsForm from "./forms/ChangeSocialsForm";
import ChangeProfileImageForm from "./forms/ChangeProfileImageForm";
import ChangeBannerImageForm from "./forms/ChangeBannerImageForm";

const User = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{
        name: string;
        username: string;
        image?: string | undefined;
    } | null>(null);
    const [profile, setProfile] = useState<{
        bio: string;
        birthdate: number | null;
        address: string;
        socialLinks: string[];
        bannerImage?: string | undefined;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getProfileData();
                setUser(data.user);
                setProfile(data.profile);
            } catch (err) {
                toast.error("Failed to load profile settings.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChangeNameForm name={user?.name ?? ""} isLoading={isLoading} />
            <ChangeUsernameForm
                username={user?.username ?? ""}
                isLoading={isLoading}
            />
            <ChangeBirthdate
                birthdate={profile?.birthdate ?? null}
                isLoading={isLoading}
            />
        </div>
    );
};

export default User;
