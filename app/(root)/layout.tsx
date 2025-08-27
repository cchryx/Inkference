import { ChooseUsernameForm } from "@/components/auth/ChooseUsernameForm";
import NavbarLeft from "@/components/root/NavbarLeft";
import NavbarMobile from "@/components/root/NavbarMobile";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { headers } from "next/headers";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();

    return {
        title: `Inkference — ${userCount} users & ${projectCount} projects`,
        description: `Join ${userCount} creators and explore ${projectCount} amazing projects on Inkference.`,
        openGraph: {
            title: `Inkference — ${userCount} users & ${projectCount} projects`,
            description: `Showcase your work and connect with creators.`,
            siteName: "Inkference",
            images: [
                {
                    url: "/icon512_maskable.png",
                    alt: "Inkference Icon",
                },
            ],
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `Inkference — ${userCount} users & ${projectCount} projects`,
            description: `Showcase your work and connect with creators.`,
            images: ["/assets/welcome/welcomeBg.jpg"],
        },
    };
}

export default async function Layout({ children }: LayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex flex-col md:flex-row h-full w-full fixed">
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
                    <section className="md:hidden">
                        <NavbarMobile session={session} />
                    </section>
                )}
            </div>
        </div>
    );
}
