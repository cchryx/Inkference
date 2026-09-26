// Helpers for the photo cropper (browser only).
import type { Area } from "react-easy-crop";

// Longest side of an uploaded photo. Big enough to look sharp on any screen,
// small enough that uploads are quick (usually well under 1 MB each).
const MAX_SIDE = 2160;

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/** The biggest box of this shape that fits in the middle of the photo. */
export function centerCrop(width: number, height: number, aspect: number): Area {
    let w = width;
    let h = width / aspect;
    if (h > height) {
        h = height;
        w = height * aspect;
    }
    return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

/** Cuts out the crop area, shrinks it if it's huge, and returns a JPEG. */
export async function cropToBlob(src: string, area: Area): Promise<Blob> {
    const img = await loadImage(src);
    const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.width * scale);
    canvas.height = Math.round(area.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.imageSmoothingQuality = "high";
    // White behind see-through PNGs (JPEG has no transparency).
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
            "image/jpeg",
            0.9
        )
    );
}

export function isHeic(file: File) {
    return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/**
 * iPhone HEIC photos can't be shown by most browsers, so they're turned
 * into JPEGs as soon as they're picked (before cropping).
 */
export async function toBrowserImage(file: File): Promise<File> {
    if (!isHeic(file)) return file;
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(out) ? out[0] : out;
    return new File([blob], file.name.replace(/\.hei[cf]$/i, ".jpg"), {
        type: "image/jpeg",
    });
}
