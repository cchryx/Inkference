"use client";

import { useEffect, useState } from "react";
import { getProfileData } from "@/actions/profile/getProfileData";
import ChangeBioForm from "./forms/ChangeBioForm";
import ChangeAddressForm from "./forms/ChangeAddressForm";
import { toast } from "sonner";
import ChangeSocialsForm from "./forms/ChangeSocialsForm";
import ChangeProfileImageForm from "./forms/ChangeProfileImageForm";
import ChangeBannerImageForm from "./forms/ChangeBannerImageForm";

const Profile = () => {
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
            <ChangeProfileImageForm
                profileImage={user?.image ?? undefined}
                isLoading={isLoading}
            />
            <ChangeBannerImageForm
                bannerImage={profile?.bannerImage ?? undefined}
                isLoading={isLoading}
            />
            <ChangeBioForm
                biography={profile?.bio ?? ""}
                isLoading={isLoading}
            />
            <ChangeSocialsForm
                socialLinks={profile?.socialLinks ?? []}
                isLoading={isLoading}
            />
            <ChangeAddressForm
                address={profile?.address ?? ""}
                isLoading={isLoading}
            />
        </div>
    );
};

export default Profile;
