import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import PushSync from "@/components/general/PushSync";
import VerifiedToast from "@/components/general/VerifiedToast";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/context/QueryProvider";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { SITE_URL } from "@/lib/siteUrl";

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
        metadataBase: new URL(SITE_URL),
        // Page titles become "Page name | Inkference".
        title: { default: "Inkference", template: "%s | Inkference" },
        applicationName: "Inkference",
        description: `Join ${userCount} builders and explore ${projectCount} projects on Inkference. Show your work, plan it, and connect.`,
        keywords: ["portfolio", "builders", "projects", "showcase", "planner", "social network", "Inkference"],
        robots: { index: true, follow: true },
        // Optional: paste Google Search Console's HTML-tag code into this env var.
        verification: process.env.GOOGLE_SITE_VERIFICATION
            ? { google: process.env.GOOGLE_SITE_VERIFICATION }
            : undefined,
        // The preview picture comes from app/opengraph-image.tsx (themed, live counts).
        openGraph: {
            title: `Inkference · ${userCount} builders, ${projectCount} projects`,
            description: "Build your portfolio, plan your work on real dates, and find your people.",
            siteName: "Inkference",
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `Inkference · ${userCount} builders, ${projectCount} projects`,
            description: "Build your portfolio, plan your work on real dates, and find your people.",
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
                    <PushSync />
                    <VerifiedToast />
                    <Toaster position="top-center" richColors />
                </SerwistProvider>
            </body>
        </html>
    );
}
