import { Suspense } from "react";
import { redirect } from "next/navigation";
import MessagesApp from "@/components/messages/MessagesApp";
import { getSession } from "@/lib/session";

export const metadata = { title: "Messages" };

export default async function Page() {
    const session = await getSession();
    if (!session) return redirect("/auth/signin");

    return (
        <Suspense fallback={null}>
            <MessagesApp meId={session.user.id} />
        </Suspense>
    );
}
