import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <div className="flex items-center justify-center h-dvh">
            Other stuff
        </div>
    );
}
