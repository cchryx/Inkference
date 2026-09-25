import { createSerwistRoute } from "@serwist/turbopack";
import { spawnSync } from "node:child_process";

// A version tag for the offline page, so browsers re-download it after
// each new commit. Falls back to a random ID if git isn't available.
const revision =
    spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
    crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
    createSerwistRoute({
        additionalPrecacheEntries: [{ url: "/~offline", revision }],
        swSrc: "app/sw.ts",
        useNativeEsbuild: true,
    });
