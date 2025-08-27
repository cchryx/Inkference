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

// ✅ Root-level metadataBase (Next.js reads this at build time)
const appUrl =
    process.env.PORT || // works on Render automatically
    process.env.NEXT_PUBLIC_SITE_URL || // fallback for other hosts
    "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: "Inkference",
    description: "Showcase your work and connect with creators.",
    icons: {
        icon: "/favicon.ico",
    },
};

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
