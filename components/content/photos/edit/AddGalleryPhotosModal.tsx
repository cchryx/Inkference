"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import PhotoEditor from "@/components/general/photo-editor/PhotoEditor";
import { exportPhotos } from "@/components/general/photo-editor/exportPhotos";
import { uploadInBatches } from "@/components/general/photo-editor/uploadInBatches";
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
    const [progress, setProgress] = useState<string | null>(null);
    const isPending = progress !== null;

    const close = () => {
        images.forEach((i) => URL.revokeObjectURL(i.url));
        onCloseModal();
    };

    const submit = async () => {
        if (!images.length) return;
        try {
            setProgress("Preparing...");
            const files = await exportPhotos(images);
            const { urls, failed } = await uploadInBatches(files, "photos", (done, total) =>
                setProgress(`Uploading ${done}/${total}`)
            );
            if (failed) toast.error(`${failed} photo(s) failed to upload.`);
            if (!urls.length) return;

            const res = await addGalleryPhotos({ galleryId, photos: urls });
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success(`Added ${urls.length} photo${urls.length > 1 ? "s" : ""}.`);
            close();
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload photos.");
        } finally {
            setProgress(null);
        }
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
            pending={isPending}
            pendingLabel={progress ?? undefined}
            disabled={!count}
        >
            <PhotoEditor images={images} setImages={setImages} maxImages={MAX_IMAGES} perPhotoShape />
        </StepModal>
    );
}
