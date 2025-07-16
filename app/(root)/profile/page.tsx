import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <div className="px-6 py-16 container mx-auto max-w-screen-lg space-y-8">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Profile</h1>
            </div>
        </div>
    );
}
