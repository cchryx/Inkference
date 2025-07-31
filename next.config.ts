import withPWA from "next-pwa";
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@node-rs/argon2"],
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Add your other Next.js config options here
};

export default withPWA({
    dest: "public", // This is the destination folder for service workers
    disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
    register: true, // Automatically register the service worker
    skipWaiting: true, // Take control of pages immediately
    // You can add other PWA-specific options here
})(nextConfig);
