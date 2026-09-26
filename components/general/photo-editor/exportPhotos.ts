import { centerCrop, cropToBlob } from "@/lib/cropImage";
import { ASPECT_OPTIONS, isGif, type CroppableImage } from "./aspects";

/**
 * Turns the edited photos into the files we upload: cropped, shrunk to a
 * sensible size and saved as JPEG (so uploads are quick).
 *
 * - `aspect` given (posts): every photo gets that shape.
 * - no `aspect` (galleries): each photo uses its own shape; "Original"
 *   keeps the whole photo, and GIFs are uploaded untouched so they still move.
 */
export async function exportPhotos(images: CroppableImage[], aspect?: number): Promise<File[]> {
    const files: File[] = [];

    for (const img of images) {
        const shape =
            aspect ?? ASPECT_OPTIONS.find((o) => o.key === (img.aspectKey ?? "original"))?.value;

        if (!aspect && isGif(img)) {
            files.push(img.file);
            continue;
        }

        const saved = img.croppedAreaPixels;
        const area = !shape
            ? { x: 0, y: 0, width: img.width, height: img.height }
            : saved && Math.abs(saved.width / saved.height - shape) < 0.01
              ? saved
              : centerCrop(img.width, img.height, shape);

        const blob = await cropToBlob(img.url, area);
        const name = img.file.name.replace(/\.[^.]+$/, "") + ".jpg";
        files.push(new File([blob], name, { type: "image/jpeg" }));
    }

    return files;
}
