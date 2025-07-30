import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUserProjects } from "@/actions/content/getUserProjects";
import Content from "@/components/content/Content";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    const projects = await getUserProjects(session.user.id);
    const content = { projects };

    return (
        <div className="w-full px-[2%] py-5">
            <Content rootUser content={content} />
        </div>
    );
}
