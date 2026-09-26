import { getProfileData } from "@/actions/profile/getProfileData";
import FriendsWrapper from "@/components/social/friends/FriendsWrapper";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Page() {
    const session = await getSession();

    if (!session) {
        redirect("/auth/signin");
    }

    const profileData = await getProfileData(session.user.username);

    // Ensure it's an array of friends with user info
    const friendsList = profileData?.relationships?.friends || [];

    return <FriendsWrapper friendsList={friendsList} />;
}
