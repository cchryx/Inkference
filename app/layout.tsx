import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/context/QueryProvider";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// These numbers show in link previews on every page. Counting the whole
// table on every request is slow, so the result is cached for an hour.
const getSiteCounts = unstable_cache(
    async () => {
        const [userCount, projectCount] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
        ]);
        return { userCount, projectCount };
    },
    ["site-counts"],
    { revalidate: 3600 }
);

export async function generateMetadata(): Promise<Metadata> {
    const { userCount, projectCount } = await getSiteCounts();

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL!),
        title: `Inkference`,
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

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen`}
            >
                <SerwistProvider
                    swUrl="/serwist/sw.js"
                    disable={process.env.NODE_ENV === "development"}
                >
                    <QueryProvider>{children}</QueryProvider>
                    <Toaster position="top-center" richColors />
                </SerwistProvider>
            </body>
        </html>
    );
}
