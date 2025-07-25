import { ChooseUsernameForm } from "@/components/auth/ChooseUsernameForm";
import NavbarLeft from "@/components/root/NavbarLeft";
import NavbarMobile from "@/components/root/NavbarMobile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default async function Layout({ children }: LayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex flex-col md:flex-row h-full">
            {session && (
                <div className="hidden md:flex max-w-[250px]">
                    <NavbarLeft session={session} />
                </div>
            )}

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <section className="flex-1 overflow-x-scroll no-scrollbar">
                    {session ? (
                        session.user.username ? (
                            children
                        ) : (
                            <ChooseUsernameForm />
                        )
                    ) : (
                        children
                    )}
                </section>
                {session && (
                    <section className="md:hidden h-[60px]">
                        <NavbarMobile session={session} />
                    </section>
                )}
            </div>
        </div>
    );
}
