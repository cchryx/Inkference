import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import WelcomeWrapper from "@/components/welcome/WelcomeWrapper";
import { prisma } from "@/lib/prisma";
import JsonLd from "@/components/general/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
    title: { absolute: "Inkference: build your portfolio, plan your work" },
    alternates: { canonical: "/" },
    description:
        "Inkference is a portfolio and social platform for builders. Show off your projects, skills and resume, post your work, plan your week with reminders, track what you're watching, and connect with people who make things.",
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
        getSession(),
    ]);

    return (
        <>
            {/* Tells Google the site's name and what it is */}
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebSite",
                            name: "Inkference",
                            alternateName: ["inkference.app", "Inkference App"],
                            url: `${SITE_URL}/`,
                            description:
                                "A portfolio, planner and social platform for builders to show projects, experience and skills.",
                        },
                        {
                            "@type": "Organization",
                            name: "Inkference",
                            url: SITE_URL,
                            logo: `${SITE_URL}/icon512_rounded.png`,
                            email: "inkference@gmail.com",
                        },
                    ],
                }}
            />
            <WelcomeWrapper
                stats={stats}
                signedInAs={session?.user?.name ?? null}
            />
        </>
    );
}
