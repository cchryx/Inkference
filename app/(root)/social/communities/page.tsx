import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import ComingSoon from "@/components/general/ComingSoon";
import { getSession } from "@/lib/session";

export default async function Page() {
    const session = await getSession();

    if (!session) return redirect("/auth/signin");

    return (
        <ComingSoon
            icon={Building2}
            title="Communities"
            text="Spaces for clubs, classes and teams to share work together."
            planned={[
                "Join communities around a skill, school or interest",
                "Community feeds and pinned posts",
                "Events and shared planners",
                "Admins and member roles",
            ]}
            back={{ href: "/social/friends", label: "Go to Friends" }}
        />
    );
}
