"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import StepModal from "@/components/general/StepModal";
import PhotoEditor from "@/components/general/photo-editor/PhotoEditor";
import { exportPhotos } from "@/components/general/photo-editor/exportPhotos";
import { uploadInBatches } from "@/components/general/photo-editor/uploadInBatches";
import type { CroppableImage } from "@/components/general/photo-editor/aspects";
import { createGallery } from "@/actions/content/photos/createGallery";

type Props = {
    onCloseModal: () => void;
    currentUserId: string;
};

const MAX_IMAGES = 100;
const MAX_NAME = 60;
const STEPS = ["Choose photos", "Name your gallery"];

export default function AddPhotosModal({ onCloseModal }: Props) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [images, setImages] = useState<CroppableImage[]>([]);
    const [name, setName] = useState("");
    const [progress, setProgress] = useState<string | null>(null);
    const isPending = progress !== null;

    const close = () => {
        images.forEach((i) => URL.revokeObjectURL(i.url));
        onCloseModal();
    };

    const submit = async () => {
        if (!name.trim()) {
            toast.error("Give your gallery a name.");
            return;
        }
        try {
            setProgress("Preparing...");
            const files = await exportPhotos(images);
            const { urls, failed } = await uploadInBatches(files, "photos", (done, total) =>
                setProgress(`Uploading ${done}/${total}`)
            );
            if (failed) toast.error(`${failed} photo(s) failed to upload.`);
            if (!urls.length) return;

            const res = await createGallery({ name: name.trim(), photos: urls });
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Gallery created.");
            close();
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Failed to create gallery.");
        } finally {
            setProgress(null);
        }
    };

    return (
        <StepModal
            title="Create gallery"
            steps={STEPS}
            step={step}
            size="lg"
            onClose={close}
            dirty={images.length > 0 || !!name.trim()}
            discardTitle="Discard this gallery?"
            discardText="Your photos and gallery name will be lost."
            onBack={() => setStep(0)}
            onNext={() => setStep(1)}
            onSubmit={submit}
            submitLabel="Create gallery"
            pending={isPending}
            pendingLabel={progress ?? undefined}
            disabled={!images.length || (step === 1 && !name.trim())}
        >
            {step === 0 && (
                <PhotoEditor images={images} setImages={setImages} maxImages={MAX_IMAGES} perPhotoShape />
            )}

            {step === 1 && (
                <div className="flex flex-col gap-5 w-full max-w-[560px] mx-auto">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="gallery-name" className="text-sm font-semibold">
                            Gallery name
                        </Label>
                        <Input
                            id="gallery-name"
                            autoFocus
                            placeholder="e.g. Summer in Toronto"
                            value={name}
                            disabled={isPending}
                            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                            onKeyDown={(e) => e.key === "Enter" && !isPending && submit()}
                        />
                        <span className="text-xs text-gray-500">
                            {MAX_NAME - name.length} characters left
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {images.length} photo{images.length === 1 ? "" : "s"}
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                            {images.map((img, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={img.id}
                                    src={img.url}
                                    alt={`Photo ${i + 1}`}
                                    className="aspect-square w-full object-cover rounded-md bg-gray-200"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </StepModal>
    );
}
