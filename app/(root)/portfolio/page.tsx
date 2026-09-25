import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Content from "@/components/content/Content";
import { getUserData } from "@/actions/users/getUserData";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    // Your own portfolio also shows your saved / liked / viewed projects.
    const userData = await getUserData(session.user.id, { includeActivity: true });

    return (
        <div className="w-full px-[2%] py-5">
            <Content rootUser userData={userData} />
        </div>
    );
}
