import type { Area } from "react-easy-crop";

export type CroppableImage = {
    id: string;
    file: File;
    url: string;
    width: number;
    height: number;
    crop: { x: number; y: number };
    zoom: number;
    croppedAreaPixels: Area | null;
    // Only used when each photo has its own shape (galleries).
    aspectKey?: AspectKey;
};

export type AspectKey = "original" | "1:1" | "4:5" | "16:9";

// Same shapes Instagram uses. One shape for the whole post, so swiping
// through the photos never makes the post jump in size.
export const ASPECT_OPTIONS: { key: AspectKey; label: string; hint: string; value?: number }[] = [
    { key: "original", label: "Original", hint: "Shape of your first photo" },
    { key: "1:1", label: "1:1", hint: "Square", value: 1 },
    { key: "4:5", label: "4:5", hint: "Portrait", value: 4 / 5 },
    { key: "16:9", label: "16:9", hint: "Landscape", value: 16 / 9 },
];

// "Original" still stays between tall (3:4) and wide (16:9) so posts look tidy.
const MIN_RATIO = 3 / 4;
const MAX_RATIO = 16 / 9;

export function resolveAspect(key: AspectKey, images: CroppableImage[]) {
    const preset = ASPECT_OPTIONS.find((o) => o.key === key)?.value;
    if (preset) return preset;
    const first = images[0];
    if (!first?.width || !first?.height) return 1;
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, first.width / first.height));
}

export const isGif = (img: CroppableImage) => img.file.type === "image/gif";
