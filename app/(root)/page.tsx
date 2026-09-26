import { redirect } from "next/navigation";
import HomeWrapper from "@/components/home/HomeWrapper";
import { getSession } from "@/lib/session";

export default async function Page() {
    const session = await getSession();

    if (!session) return redirect("/auth/signin");

    return (
        <div className="flex flex-col h-full fixed relative overflow-hidden">
            <HomeWrapper currentUserId={session.user.id} />
        </div>
    );
}
