"use client";

import Socialnavbar from "@/components/social/Socialnavbar";
import SocialnavbarMobile from "@/components/social/SocialnavbarMobile";

export default function SocialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full md:flex h-full">
            <div className="flex flex-col h-full w-full overflow-hidden">
                <SocialnavbarMobile />
                <section className="flex flex-grow justify-center overflow-scroll no-scrollbar">
                    {children}
                </section>
            </div>
            <Socialnavbar />
        </div>
    );
}
