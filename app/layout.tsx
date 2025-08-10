import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/context/QueryProvider";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();

    return {
        title: `Inkference`,
        description: `Join ${userCount} creators and explore ${projectCount} amazing projects on Inkference.`,
        openGraph: {
            title: `Inkference — ${userCount} users & ${projectCount} projects`,
            description: `Showcase your work and connect with creators.`,
            url: "https://inkference.space",
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

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen`}
            >
                <QueryProvider>{children}</QueryProvider>
                <Toaster position="top-center" richColors />
            </body>
        </html>
    );
}
