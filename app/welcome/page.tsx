import type { Metadata } from "next";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import WelcomeWrapper from "@/components/welcome/WelcomeWrapper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Inkference: build your portfolio, share your work",
    description:
        "Inkference is a portfolio and social platform for creators. Show off your projects, experience and skills, post photos, and connect with other creators.",
};

// Counted at most every 10 minutes instead of on every visit.
const getStats = unstable_cache(
    async () => {
        const [users, projects, posts] = await Promise.all([
            prisma.user.count({ where: { username: { not: null } } }),
            prisma.project.count(),
            prisma.post.count({ where: { type: "post" } }),
        ]);
        return { users, projects, posts };
    },
    ["welcome-stats"],
    { revalidate: 600 }
);

export default async function WelcomePage() {
    const [stats, session] = await Promise.all([
        getStats(),
        auth.api.getSession({ headers: await headers() }),
    ]);

    return (
        <WelcomeWrapper
            stats={stats}
            signedInAs={session?.user?.name ?? null}
        />
    );
}
