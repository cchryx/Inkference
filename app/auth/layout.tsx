import { ReactNode } from "react";
import AuthSidePanel, { Logo } from "@/components/auth/AuthSidePanel";

type LayoutProps = {
    children: ReactNode;
};

// Blueprint grid, same as the welcome page.
const GRID = {
    backgroundImage:
        "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="fixed inset-0 flex bg-[#f3f3f1] text-neutral-900" style={GRID}>
            {/* Form side: scrolls on its own, so long forms never get cut off on phones */}
            <section className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                {/* Phones: a slim branded bar instead of the side panel */}
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-neutral-900/15 bg-[#f3f3f1]/90 px-4 backdrop-blur md:hidden">
                    <Logo />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Build · Plan · Share</span>
                </header>

                <div className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-10">
                    {children}
                </div>
            </section>

            <AuthSidePanel />
        </div>
    );
}
