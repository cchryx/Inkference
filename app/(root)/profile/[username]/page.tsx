import { getProfileData } from "@/actions/profile/getProfileData";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { SocialsCard } from "@/components/profile/SocialsCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Content from "@/components/content/Content";
import RecommendedAccountsCard from "@/components/profile/RecommendedAccountsCard";
import { getUserProjects } from "@/actions/content/project/getUserProjects";

export default async function Page({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let tUser: any = await prisma.user.findFirst({
        where: {
            username,
        },
    });

    if (!tUser) {
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

    const profileData = await getProfileData(username);
    const projects = await getUserProjects(tUser.id);

    tUser = {
        ...tUser,
        ...profileData.profile,
        relationships: profileData.relationships,
        projects,
    };

    return (
        <div className="w-full">
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
