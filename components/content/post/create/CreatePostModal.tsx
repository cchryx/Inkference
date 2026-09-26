"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StepModal from "@/components/general/StepModal";
import { createPost } from "@/actions/content/post/createPost";
import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";
import PhotoEditor from "@/components/general/photo-editor/PhotoEditor";
import { exportPhotos } from "@/components/general/photo-editor/exportPhotos";
import Step2 from "./Step2";
import Preview from "./Preview";
import {
    resolveAspect,
    type AspectKey,
    type CroppableImage,
} from "@/components/general/photo-editor/aspects";

type Props = {
    onCloseModal: () => void;
    currentUserId: string;
};

const STEPS = ["Crop photos", "Add details", "Preview"];

type Cropped = { file: File; url: string };

export default function CreatePostModal({ onCloseModal, currentUserId }: Props) {
    const router = useRouter();
    const [step, setStep] = useState(0);

    // Step 1: photos + one shape for the whole post
    const [images, setImages] = useState<CroppableImage[]>([]);
    const [aspectKey, setAspectKey] = useState<AspectKey>("original");
    const aspect = resolveAspect(aspectKey, images);
    const [cropped, setCropped] = useState<Cropped[]>([]);

    // Step 2
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [locationSelected, setLocationSelected] = useState(false);

    const [working, setWorking] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const changeAspect = (key: AspectKey) => {
        setAspectKey(key);
        // New shape: start every photo fresh (centred, no zoom).
        setImages((prev) =>
            prev.map((img) => ({ ...img, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null }))
        );
    };

    const freeMemory = () => {
        images.forEach((i) => URL.revokeObjectURL(i.url));
        cropped.forEach((c) => URL.revokeObjectURL(c.url));
    };

    const close = () => {
        freeMemory();
        onCloseModal();
    };

    // Turns every photo into its final cropped JPEG.
    const cropAll = async (): Promise<Cropped[]> => {
        const files = await exportPhotos(images, aspect);
        return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    };

    const next = async () => {
        if (step === 0) {
            if (!images.length) {
                toast.error("Add at least one photo.");
                return;
            }
            setWorking(true);
            try {
                const result = await cropAll();
                cropped.forEach((c) => URL.revokeObjectURL(c.url));
                setCropped(result);
            } catch (err) {
                console.error(err);
                toast.error("Couldn't crop your photos. Please try again.");
                setWorking(false);
                return;
            }
            setWorking(false);
        }
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    };

    const back = () => setStep((s) => Math.max(0, s - 1));

    const submit = async () => {
        if (!cropped.length) {
            toast.error("Add at least one photo.");
            return;
        }
        setIsPending(true);
        try {
            const results = await uploadPhotos(
                cropped.map((c) => c.file),
                currentUserId,
                "posts"
            );
            const urls = results.filter((r) => r.url).map((r) => r.url!);
            if (urls.length < cropped.length) {
                toast.error(
                    urls.length
                        ? `${cropped.length - urls.length} photo(s) failed to upload.`
                        : "Upload failed. Please try again."
                );
                if (!urls.length) return;
            }

            const res = await createPost({
                type: "post",
                dataId: "",
                content: urls,
                description,
                location,
                mentions: [],
                tags: [],
            });

            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Posted!");
            close();
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Failed to create post.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <StepModal
            title="Create post"
            steps={STEPS}
            step={step}
            size="lg"
            onClose={close}
            dirty={images.length > 0 || !!description.trim()}
            discardTitle="Discard this post?"
            discardText="Your photos and caption will be lost."
            onBack={back}
            onNext={next}
            onSubmit={submit}
            submitLabel="Share"
            pending={isPending || working}
            disabled={step === 0 && !images.length}
        >
            {step === 0 && (
                <PhotoEditor
                    images={images}
                    setImages={setImages}
                    aspectKey={aspectKey}
                    aspect={aspect}
                    onAspectChange={changeAspect}
                />
            )}

            {step === 1 && (
                <Step2
                    description={description}
                    setDescription={setDescription}
                    location={location}
                    setLocation={setLocation}
                    locationSelected={locationSelected}
                    setLocationSelected={setLocationSelected}
                />
            )}

            {step === 2 && (
                <Preview
                    images={cropped.map((c) => c.url)}
                    aspect={aspect}
                    description={description}
                    location={location}
                />
            )}
        </StepModal>
    );
}
