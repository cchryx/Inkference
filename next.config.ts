import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@node-rs/argon2"],
    experimental: {
        serverActions: { bodySizeLimit: "500mb" } as any,
    },
};

export default withSerwist(nextConfig);
