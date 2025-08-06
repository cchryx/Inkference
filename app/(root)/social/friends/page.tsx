import { getProfileData } from "@/actions/profile/getProfileData";
import FriendsWrapper from "@/components/social/friends/FriendsWrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth/signin");
    }

    const profileData = await getProfileData(session.user.username);

    // Ensure it's an array of friends with user info
    const friendsList = profileData?.relationships?.friends || [];

    return <FriendsWrapper friendsList={friendsList} />;
}
