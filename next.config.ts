import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@node-rs/argon2"],
    eslint: { ignoreDuringBuilds: true },
    experimental: {
        serverActions: { bodySizeLimit: "500mb" } as any,
    },
};

export default withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
})(nextConfig as any);
