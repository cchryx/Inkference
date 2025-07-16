import NavbarLeft from "@/components/root/NavbarLeft";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default async function Layout({ children }: LayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return redirect("/auth/signin");

    return (
        <div className="flex h-screen">
            <div className="max-w-[250px] hidden md:flex">
                <NavbarLeft session={session} />
            </div>
            <section className="flex-1">{children}</section>
        </div>
    );
}
