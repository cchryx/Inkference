import ProfileContent from "@/components/root/ProfileContent";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { useState } from "react";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <div className="w-full px-[2%] py-5">
            <ProfileContent rootUser tUser={session.user} />
        </div>
    );
}
