import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { ReturnButton } from "@/components/auth/ReturnButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cache } from "react";
import { canViewGallery, getCurrentViewer } from "@/lib/visibility";
import { Metadata } from "next";
import { getGalleryById } from "@/actions/content/photos/getGallery";
import { UserIcon } from "@/components/general/UserIcon";
import HeaderCard from "@/components/content/photos/HeaderCard";
import { GalleryWrapper } from "@/components/content/photos/GalleryWrapper";
import { previewUrl } from "@/lib/imageUrl";
import JsonLd from "@/components/general/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";

// Loads the gallery, but only if the viewer is allowed to see it.
const getGalleryData = cache(async (id: string) => {
    const [gallery, viewer] = await Promise.all([getGalleryById(id), getCurrentViewer()]);
    if (!gallery || "error" in gallery) return gallery;
    if (!(await canViewGallery(id, viewer))) return { error: "Gallery not found." };
    return gallery;
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
            robots: { index: false },
            description: `This gallery does not exist or may have been removed.`,
        };
    }

    const previewImages = (galleryData.photos || [])
        .slice(0, 4)
        .map((photo: any, index: number) => ({
            url: previewUrl(photo.image, 1200),
        }));

    if (previewImages.length === 0) {
        previewImages.push({
            url: "/assets/general/fillerImage.png",
            alt: "Gallery preview image",
        });
    }

    const userDisplay = `${galleryData.userData.user?.name ?? "a user"}${
        galleryData.userData.user?.username
            ? ` (@${galleryData.userData.user.username})`
            : ""
    }`.trim();

    return {
        title: `${galleryData.name} by ${userDisplay}`,
        description: `A gallery created by ${userDisplay}`,
        alternates: { canonical: `/gallery/${galleryData.id}` },
        openGraph: {
            title: galleryData.name,
            description: `A gallery created by ${userDisplay}`,
            images: previewImages,
        },
        twitter: {
            card: "summary_large_image",
            title: galleryData.name,
            description: `A gallery created by ${userDisplay}`,
            images: previewImages,
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [session, gallery] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        getGalleryData(id),
    ]);
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

    const isOwner = session?.user.id === gallery.userData.user.id;

    const topPhotos = gallery.photos.slice(0, 4);

    return (
        <div className="w-full flex flex-col gap-5 my-5 px-[2%]">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "ImageGallery",
                    name: gallery.name,
                    url: `${SITE_URL}/gallery/${gallery.id}`,
                    image: gallery.photos.slice(0, 4).map((p) => previewUrl(p.image, 1200)),
                    author: {
                        "@type": "Person",
                        name: gallery.userData.user.name,
                        url: `${SITE_URL}/profile/${gallery.userData.user.username}`,
                    },
                }}
            />
            <div className="flex flex-col gap-5 lg:flex-row">
                {/* --- HEADER CARD --- */}
                <HeaderCard
                    galleryId={gallery.id}
                    galleryName={gallery.name}
                    topPhotos={topPhotos}
                    photos={gallery.photos}
                    isOwner={isOwner}
                    numOfPhotos={gallery.photos.length}
                    currentUserId={gallery.userData.user.id}
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
                    <Link href={`/profile/${gallery.userData.user.username}`}>
                        <Button
                            variant="default"
                            className="ml-auto whitespace-nowrap cursor-pointer"
                        >
                            View Profile
                        </Button>
                    </Link>
                </div>
            </div>

            {/* --- GALLERY WRAPPER --- */}
            <GalleryWrapper
                photos={gallery.photos}
                galleryImages={gallery.photos}
                isOwner={isOwner}
            />
        </div>
    );
}
