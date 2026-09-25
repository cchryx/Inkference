import { getProfileData, getProfileMeta } from "@/actions/profile/getProfileData";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { SocialsCard } from "@/components/profile/SocialsCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Content from "@/components/content/Content";
import RecommendedAccountsCard from "@/components/profile/RecommendedAccountsCard";
import { getUserData } from "@/actions/users/getUserData";
import { Metadata } from "next";
import { cache } from "react";
import { previewUrl } from "@/lib/imageUrl";
import { getViewerContext } from "@/lib/visibility";
import BlockedNotice from "@/components/profile/BlockedNotice";
import JsonLd from "@/components/general/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";

// Deduped within one request.
const loadProfile = cache(getProfileData);

type PageProps = { params: Promise<{ username: string }> };

// Link previews only need a name, bio and picture: one small cached query
// instead of loading the whole profile.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    const user = await getProfileMeta(username);

    if (!user) {
        return {
            title: `User "${username}" not found`,
            description: `The profile for "${username}" does not exist or may have been removed.`,
            robots: { index: false },
        };
    }

    const title = `${user.name} (@${user.username})`;
    const description = user.Profile?.bio || "View this user's profile on Inkference.";
    const banner = user.Profile?.bannerImage
        ? previewUrl(user.Profile.bannerImage, 1200)
        : "/assets/general/fillerImage.png";

    return {
        title,
        description,
        alternates: { canonical: `/profile/${user.username}` },
        openGraph: {
            title,
            description,
            url: `/profile/${user.username}`,
            images: [{ url: banner, alt: `${user.name}'s profile banner` }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [banner],
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { username } = await params;

    // Session and profile load at the same time.
    const [session, profileData] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        loadProfile(username),
    ]);

    if (!profileData.user.id) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="bg-gray-100 p-8 rounded shadow-md space-y-2">
                    <ReturnButton href="/" label="Home" />
                    <h1 className="text-xl font-semibold">User Not Found</h1>
                    <p>The user you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    // Blocked (either way)? Show a notice instead of the profile.
    const viewer = await getViewerContext(session?.user?.id);
    if (viewer.blocked.includes(profileData.user.id)) {
        return (
            <BlockedNotice
                userId={profileData.user.id}
                username={profileData.user.username}
                blockedByMe={viewer.blockedByMe.includes(profileData.user.id)}
            />
        );
    }

    const userData: any = await getUserData(profileData.user.id, { viewer });

    const tUser: any = {
        ...profileData.user,
        ...profileData.profile,
        relationships: profileData.relationships,
        projects: userData.projects,
        experiences: userData.experiences,
        educations: userData.educations,
        merits: userData.merits,
        posts: userData.posts,
        skills: userData.skills,
        galleries: userData.galleries,
    };

    return (
        <div className="w-full">
            {/* Tells Google this page is a person's profile */}
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "ProfilePage",
                    url: `${SITE_URL}/profile/${profileData.user.username}`,
                    mainEntity: {
                        "@type": "Person",
                        name: profileData.user.name,
                        alternateName: `@${profileData.user.username}`,
                        description: profileData.profile.bio || undefined,
                        image: profileData.user.image || undefined,
                        url: `${SITE_URL}/profile/${profileData.user.username}`,
                    },
                }}
            />
            {/* Main profile & sidebar */}
            <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full px-[2%] py-5">
                {/* Left/Main section */}
                <div className="flex-1 flex flex-col space-y-4 lg:space-y-0">
                    <ProfileCard session={session} tUser={tUser} />

                    {/* Social links for small/medium screens */}
                    <div className="block lg:hidden">
                        <SocialsCard tUser={tUser} />
                    </div>

                    {!session && (
                        <div className="lg:hidden bg-gray-200 p-4 shadow-md rounded-md flex flex-col items-start gap-3 w-full">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                We've detected that you are not signed in. Sign
                                in to access your full profile experience.
                                You’ll be able to showcase your projects, add
                                your work experiences and education, list your
                                skills, and share photos and posts with the
                                community.
                            </p>

                            <div className="flex gap-2">
                                <Button asChild>
                                    <Link href="/auth/signin">Sign In</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/auth/signup">Sign Up</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar for large screens */}
                <div className="hidden lg:flex flex-col w-[25%] space-y-4">
                    <SocialsCard tUser={tUser} />

                    {session ? (
                        <RecommendedAccountsCard />
                    ) : (
                        <div className="bg-gray-200 p-4 shadow-md rounded-md flex flex-col items-start gap-3 w-full">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                We've detected that you are not signed in. Sign
                                in to access your full profile experience.
                                You’ll be able to showcase your projects, add
                                your work experiences and education, list your
                                skills, and share photos and posts with the
                                community.
                            </p>

                            <div className="flex gap-2">
                                <Button asChild>
                                    <Link href="/auth/signin">Sign In</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/auth/signup">Sign Up</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 bg-gray-200 p-4 shadow-md rounded-md bg-[url('/assets/general/fillerImage.png')] bg-cover bg-center" />
                </div>
            </div>

            {/* Bottom section */}
            <div className="px-[2%]">
                <Content userData={tUser} />
            </div>
        </div>
    );
}
