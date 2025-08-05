import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TopbarWrapper from "@/components/home/TopbarWrapper";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <div className="flex flex-col h-full fixed relative overflow-hidden">
            <TopbarWrapper />
        </div>
    );
}
