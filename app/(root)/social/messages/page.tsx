import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import ComingSoon from "@/components/general/ComingSoon";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <ComingSoon
            icon={MessagesSquare}
            title="Messages"
            text={"Chat one-on-one or in groups with the people you follow. It's being built now."}
            planned={[
                "Private chats with friends",
                "Group chats for projects",
                "Share posts and projects in a message",
                "Push notifications for new messages",
            ]}
            back={{ href: "/social/friends", label: "Go to Friends" }}
        />
    );
}
