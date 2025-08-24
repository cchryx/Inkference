import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { getProfileData } from "@/actions/profile/getProfileData";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cache } from "react";
import { Metadata } from "next";
import { getGalleryById } from "@/actions/content/photos/getGallery";
import { UserIcon } from "@/components/general/UserIcon";
import HeaderCard from "@/components/content/photos/HeaderCard";
import GalleryImage from "@/components/content/photos/GalleryImage";

const getGalleryData = cache(async (id: string) => {
    return await getGalleryById(id);
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const galleryData: any = await getGalleryData(id);

    if (!galleryData || "error" in galleryData) {
        return {
            title: `Gallery not found`,
            description: `This gallery does not exist or may have been removed.`,
        };
    }

    const previewImage =
        galleryData?.photos?.[0]?.url || "/assets/general/fillerImage.png";

    return {
        description: `A gallery created by ${
            galleryData.user?.name ?? "a user"
        }`,
        openGraph: {
            title: galleryData.name,
            description: `A gallery created by ${
                galleryData.user?.name ?? "a user"
            }`,
            images: [previewImage],
        },
        twitter: {
            card: "summary_large_image",
            title: galleryData.name,
            description: `A gallery created by ${
                galleryData.user?.name ?? "a user"
            }`,
            images: [previewImage],
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const gallery = await getGalleryData(id);
    if (!gallery || "error" in gallery) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="bg-gray-100 p-8 rounded shadow-md space-y-2">
                    <ReturnButton href="/" label="Home" />
                    <h1 className="text-xl font-semibold">Gallery Not Found</h1>
                    <p>The gallery you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const tUser = await getProfileData(gallery.userData.user.username);
    const tProfile = tUser.profile;
    const isOwner = session?.user.id === gallery.userData.user.id;

    const topPhotos = gallery.photos.slice(0, 4);

    return (
        <>
            <div className="w-full flex flex-col gap-5 my-5 px-[2%]">
                <div className="flex flex-col gap-5 lg:flex-row">
                    {/* --- HEADER CARD --- */}
                    <HeaderCard
                        galleryId={gallery.id}
                        galleryName={gallery.name}
                        topPhotos={topPhotos}
                        isOwner={isOwner}
                        numOfPhotos={gallery.photos.length}
                        currentUserId={tUser.user.id}
                    />

                    {/* --- OWNER BOX --- */}
                    <div className="bg-gray-200 shadow-md rounded-xl p-4 flex items-center gap-3 overflow-hidden lg:w-[20rem]">
                        <div className="flex-shrink-0">
                            <UserIcon
                                size="size-12"
                                image={gallery.userData.user.image}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-500 mb-1 font-medium truncate">
                                Author
                            </p>
                            <h2 className="font-semibold truncate">
                                {gallery.userData.user.name}
                            </h2>
                            <p className="text-gray-500 text-sm truncate">
                                @{gallery.userData.user.username}
                            </p>
                        </div>
                        <Link
                            href={`/profile/${gallery.userData.user.username}`}
                        >
                            <Button
                                variant="default"
                                className="ml-auto whitespace-nowrap cursor-pointer"
                            >
                                View Profile
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                        <div key={colIndex} className="grid gap-4">
                            {gallery.photos
                                .filter((_, i) => i % 5 === colIndex) // distribute images into 5 columns
                                .map((photo, index) => (
                                    <GalleryImage
                                        key={photo.id}
                                        photo={photo}
                                        galleryImages={gallery.photos}
                                        currentIndex={gallery.photos.indexOf(
                                            photo
                                        )}
                                        isOwner={isOwner}
                                    />
                                ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
