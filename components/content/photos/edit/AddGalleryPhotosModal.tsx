"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import PhotoEditor from "@/components/general/photo-editor/PhotoEditor";
import { exportPhotos } from "@/components/general/photo-editor/exportPhotos";
import { uploadInBatches } from "@/components/general/photo-editor/uploadInBatches";
import { enqueueUpload } from "@/lib/uploadQueue";
import type { CroppableImage } from "@/components/general/photo-editor/aspects";
import { addGalleryPhotos } from "@/actions/content/photos/addGalleryPhotos";

type Props = {
    onCloseModal: () => void;
    currentUserId: string;
    galleryId: string;
};

const MAX_IMAGES = 100;

export default function AddGalleryPhotosModal({ onCloseModal, galleryId }: Props) {
    const router = useRouter();
    const [images, setImages] = useState<CroppableImage[]>([]);

    const close = () => {
        images.forEach((i) => URL.revokeObjectURL(i.url));
        onCloseModal();
    };

    // Upload in the background; the popup closes right away.
    const submit = () => {
        if (!images.length) return;
        const picked = images;
        let urls: string[] | null = null;

        enqueueUpload({
            label: `${picked.length} photo${picked.length > 1 ? "s" : ""} for your gallery`,
            run: async (report) => {
                if (!urls) {
                    report("Preparing photos...");
                    const files = await exportPhotos(picked);
                    const result = await uploadInBatches(files, "photos", (done, total) => report(`Uploading ${done}/${total}`));
                    if (!result.urls.length) throw new Error("Photos didn't upload. Try again.");
                    if (result.failed) toast.error(`${result.failed} photo(s) failed to upload.`);
                    urls = result.urls;
                }
                report("Adding to gallery...");
                const res = await addGalleryPhotos({ galleryId, photos: urls });
                if (res.error) throw new Error(res.error);
            },
            onDone: () => {
                toast.success(`Added ${picked.length} photo${picked.length > 1 ? "s" : ""}.`);
                router.refresh();
            },
            cleanup: () => picked.forEach((i) => URL.revokeObjectURL(i.url)),
        });

        toast("Uploading in the background. You can keep browsing.");
        onCloseModal();
    };

    const count = images.length;
    return (
        <StepModal
            title="Add photos"
            subtitle="Crop any photo, or keep it as it is"
            size="lg"
            onClose={close}
            dirty={count > 0}
            discardTitle="Discard these photos?"
            discardText="The photos you picked won't be added."
            onSubmit={submit}
            submitLabel={count ? `Add ${count} photo${count > 1 ? "s" : ""}` : "Add photos"}
            disabled={!count}
        >
            <PhotoEditor images={images} setImages={setImages} maxImages={MAX_IMAGES} perPhotoShape />
        </StepModal>
    );
}
