"use client";

import GalleryCard from "../cards/GalleryCard";

type Props = {
    galleries: any[];
    rootUser?: boolean;
};

const Photos = ({ galleries, rootUser = false }: Props) => {
    if (!galleries || galleries.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not uploaded any photos yet."
                    : "You have not uploaded any photos yet. You can try uploading some now."}
            </div>
        );
    }

    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleries.map((gallery) => (
                <GalleryCard key={gallery.id} gallery={gallery} />
            ))}
        </div>
    );
};

export default Photos;
