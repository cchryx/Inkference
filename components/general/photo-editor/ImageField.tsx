"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus, Link2, Pencil, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Loader from "@/components/general/Loader";
import InfoTooltip from "@/components/general/InfoToolTip";
import { centerCrop, cropToBlob, loadImage, toBrowserImage } from "@/lib/cropImage";
import { uploadPhotos } from "@/actions/content/photos/uploadPhotos";

type Props = {
    label: string;
    hint?: string;
    value: string;
    onChange: (url: string) => void;
    /** Width / height of the image, e.g. 1 for an icon, 3 for a banner. */
    aspect: number;
    /** Cloudinary folder inside the user's space. */
    folder: "projects" | "merits" | "photos";
    /** Icons are shown small; banners stretch to full width. */
    variant?: "icon" | "wide";
};

const MAX_FILE_MB = 20;

type Draft = { url: string; width: number; height: number; crop: { x: number; y: number }; zoom: number; area: Area | null; name: string };

/**
 * One image (like a project icon or banner): upload from your device and
 * crop it to the right shape, or paste a link. Same feel as the post uploader.
 */
export default function ImageField({ label, hint, value, onChange, aspect, folder, variant = "wide" }: Props) {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [showLink, setShowLink] = useState(false);
    const [dropping, setDropping] = useState(false);
    const [broken, setBroken] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const pick = () => inputRef.current?.click();

    const openFile = async (file?: File) => {
        if (!file) return;
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.error(`That image is over ${MAX_FILE_MB} MB.`);
            return;
        }
        setBusy("Opening...");
        try {
            const ready = await toBrowserImage(file);
            const url = URL.createObjectURL(ready);
            const img = await loadImage(url);
            setDraft({ url, width: img.naturalWidth, height: img.naturalHeight, crop: { x: 0, y: 0 }, zoom: 1, area: null, name: ready.name });
        } catch {
            toast.error("Couldn't open that image.");
        } finally {
            setBusy(null);
        }
    };

    const cancelDraft = () => {
        if (draft) URL.revokeObjectURL(draft.url);
        setDraft(null);
    };

    const useDraft = async () => {
        if (!draft) return;
        setBusy("Uploading...");
        try {
            const area = draft.area ?? centerCrop(draft.width, draft.height, aspect);
            const blob = await cropToBlob(draft.url, area);
            const file = new File([blob], draft.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
            const [result] = await uploadPhotos([file], undefined, folder);
            if (!result?.url) {
                toast.error(result?.error ?? "Upload failed.");
                return;
            }
            onChange(result.url);
            setBroken(false);
            cancelDraft();
        } catch (err) {
            console.error(err);
            toast.error("Upload failed.");
        } finally {
            setBusy(null);
        }
    };

    const boxClass =
        variant === "icon" ? "size-28 shrink-0" : "w-full";
    const boxStyle = variant === "icon" ? undefined : { aspectRatio: aspect };

    const fileInput = (
        <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => {
                openFile(e.target.files?.[0]);
                e.target.value = "";
            }}
        />
    );

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{label}</span>
                {hint && <InfoTooltip text={hint} />}
            </div>
            {fileInput}

            {draft ? (
                // ---------- Cropping ----------
                <div className="flex flex-col gap-3">
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
                        <Cropper
                            image={draft.url}
                            crop={draft.crop}
                            zoom={draft.zoom}
                            aspect={aspect}
                            minZoom={1}
                            maxZoom={4}
                            showGrid
                            cropShape="rect"
                            style={{ containerStyle: { background: "#e5e7eb" } }}
                            onCropChange={(crop) => setDraft((d) => d && { ...d, crop })}
                            onZoomChange={(zoom) => setDraft((d) => d && { ...d, zoom })}
                            onCropComplete={(_, area) => setDraft((d) => d && { ...d, area })}
                        />
                        {busy && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/70 text-sm font-medium">
                                <Loader size={5} color="text-gray-700" /> {busy}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <ZoomOut className="size-4 text-gray-500 shrink-0" />
                        <Slider
                            value={[draft.zoom]}
                            min={1}
                            max={4}
                            step={0.01}
                            onValueChange={([zoom]) => setDraft((d) => d && { ...d, zoom })}
                            className="flex-1"
                            aria-label="Zoom"
                        />
                        <ZoomIn className="size-4 text-gray-500 shrink-0" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelDraft} disabled={!!busy}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={useDraft} disabled={!!busy}>
                            Use image
                        </Button>
                    </div>
                </div>
            ) : (
                // ---------- Preview / empty ----------
                <div className={variant === "icon" ? "flex items-center gap-4" : "flex flex-col gap-2"}>
                    <div
                        className={`relative group rounded-lg overflow-hidden ${boxClass} ${
                            value && !broken ? "bg-gray-200" : "border-2 border-dashed cursor-pointer transition-colors"
                        } ${
                            !value || broken
                                ? dropping
                                    ? "border-black bg-gray-200"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-200/60"
                                : ""
                        }`}
                        style={boxStyle}
                        onClick={() => (!value || broken) && pick()}
                        onDragOver={(e) => {
                            if (!e.dataTransfer.types.includes("Files")) return;
                            e.preventDefault();
                            setDropping(true);
                        }}
                        onDragLeave={() => setDropping(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDropping(false);
                            openFile(e.dataTransfer.files?.[0]);
                        }}
                    >
                        {value && !broken ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={value}
                                    alt={label}
                                    onError={() => setBroken(true)}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={pick}
                                        aria-label={`Change ${label}`}
                                        className="rounded-full bg-white/90 hover:bg-white p-2 cursor-pointer"
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange("")}
                                        aria-label={`Remove ${label}`}
                                        className="rounded-full bg-white/90 hover:bg-white p-2 cursor-pointer"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-gray-600">
                                {busy ? (
                                    <Loader size={5} color="text-gray-700" />
                                ) : (
                                    <>
                                        <ImagePlus className={variant === "icon" ? "size-6" : "size-7"} />
                                        <span className="text-xs font-medium">
                                            {broken ? "Link didn't load. Upload instead" : variant === "icon" ? "Upload" : "Upload or drag an image"}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        {value && !broken && (
                            <div className="flex gap-2 sm:hidden">
                                <Button type="button" variant="outline" size="sm" onClick={pick}>
                                    Change
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
                                    Remove
                                </Button>
                            </div>
                        )}
                        {showLink ? (
                            <Input
                                autoFocus
                                placeholder="https://example.com/image.png"
                                value={value}
                                onChange={(e) => {
                                    setBroken(false);
                                    onChange(e.target.value.trim());
                                }}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowLink(true)}
                                className="flex items-center gap-1 w-fit text-xs text-gray-600 hover:text-black cursor-pointer"
                            >
                                <Link2 className="size-3.5" /> or paste a link
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
