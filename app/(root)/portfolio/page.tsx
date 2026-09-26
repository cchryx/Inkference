import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import Content from "@/components/content/Content";
import { getUserData } from "@/actions/users/getUserData";
import { getHiddenSections } from "@/lib/profilePrefs";
import { BUILD_TAB_COOKIE } from "@/lib/profileSections";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; section?: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    // Your own portfolio also shows your saved / liked / viewed projects.
    const [userData, hiddenSections, params, jar] = await Promise.all([
        getUserData(session.user.id, { includeActivity: true }),
        getHiddenSections(session.user.id),
        searchParams,
        cookies(),
    ]);
    // A link's tab wins, else the tab you had open last time.
    const initialTab = params.section ?? params.tab ?? jar.get(BUILD_TAB_COOKIE)?.value;

    return (
        <div className="w-full px-[2%] py-5">
            <Content rootUser userData={userData} initialTab={initialTab} hiddenSections={hiddenSections} />
        </div>
    );
}
