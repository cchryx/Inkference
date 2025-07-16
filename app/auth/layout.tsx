import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden flex-col md:flex-row">
            <section className="w-full md:w-[60%] flex justify-center">
                {children}
            </section>
            <div className="hidden md:flex h-full justify-end items-end w-[40%]">
                <img
                    src="/assets/auth/authSideBanner.png"
                    alt="Banner"
                    className="object-cover w-full h-full"
                />
            </div>
        </div>
    );
}
