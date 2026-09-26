"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    ImagePlus,
    Plus,
    RotateCcw,
    Trash2,
    X,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Loader from "@/components/general/Loader";
import { toBrowserImage, loadImage } from "@/lib/cropImage";
import { ASPECT_OPTIONS, isGif, type AspectKey, type CroppableImage } from "./aspects";

type Props = {
    images: CroppableImage[];
    setImages: React.Dispatch<React.SetStateAction<CroppableImage[]>>;
    maxImages?: number;
} & (
    // Posts: one shape for every photo.
    | { perPhotoShape?: false; aspectKey: AspectKey; aspect: number; onAspectChange: (key: AspectKey) => void }
    // Galleries: each photo picks its own shape ("Original" = no crop).
    | { perPhotoShape: true; aspectKey?: never; aspect?: never; onAspectChange?: never }
);

const MAX_FILE_MB = 20;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Pick, crop and arrange photos. Used by posts and galleries. */
export default function PhotoEditor(props: Props) {
    const { images, setImages, maxImages: MAX_IMAGES = 20 } = props;
    const [activeId, setActiveId] = useState<string | null>(images[0]?.id ?? null);
    const [busy, setBusy] = useState(false);
    const [dropping, setDropping] = useState(false);
    const dragId = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeIndex = Math.max(0, images.findIndex((i) => i.id === activeId));
    const active = images[activeIndex];

    // Shape of the photo on screen right now.
    const shapeKey: AspectKey = props.perPhotoShape
        ? active?.aspectKey ?? "original"
        : props.aspectKey;
    const shapeValue = props.perPhotoShape
        ? ASPECT_OPTIONS.find((o) => o.key === shapeKey)?.value ??
          (active ? active.width / active.height : 1)
        : props.aspect;
    // Galleries: "Original" and GIFs are shown as-is, no cropping.
    const canCrop = !!active && !(props.perPhotoShape && (shapeKey === "original" || isGif(active)));

    const changeShape = (key: AspectKey) => {
        if (!props.perPhotoShape) return props.onAspectChange(key);
        if (!active) return;
        update(active.id, { aspectKey: key, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
    };

    const openPicker = () => fileInputRef.current?.click();

    const update = (id: string, patch: Partial<CroppableImage>) =>
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));

    const addFiles = async (list: FileList | File[] | null) => {
        if (!list || busy) return;
        const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.hei[cf]$/i.test(f.name));
        if (!files.length) return;

        const room = MAX_IMAGES - images.length;
        if (room <= 0) {
            toast.error(`You can add up to ${MAX_IMAGES} photos.`);
            return;
        }

        const tooBig = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024).length;
        if (tooBig) toast.error(`${tooBig} photo(s) skipped (over ${MAX_FILE_MB} MB).`);
        const ok = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
        if (ok.length > room) toast.error(`Only ${room} more photo(s) fit in this post.`);

        setBusy(true);
        const added: CroppableImage[] = [];
        for (const original of ok.slice(0, room)) {
            try {
                const file = await toBrowserImage(original);
                const url = URL.createObjectURL(file);
                const img = await loadImage(url);
                added.push({
                    id: crypto.randomUUID(),
                    file,
                    url,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    crop: { x: 0, y: 0 },
                    zoom: 1,
                    croppedAreaPixels: null,
                    ...(props.perPhotoShape ? { aspectKey: "original" as const } : {}),
                });
            } catch {
                toast.error(`Couldn't open ${original.name}.`);
            }
        }
        setBusy(false);

        if (added.length) {
            setImages((prev) => [...prev, ...added]);
            setActiveId(added[0].id);
        }
    };

    const remove = (id: string) => {
        const index = images.findIndex((i) => i.id === id);
        const target = images[index];
        if (!target) return;
        URL.revokeObjectURL(target.url);
        const rest = images.filter((i) => i.id !== id);
        setImages(rest);
        if (id === active?.id) setActiveId(rest[Math.min(index, rest.length - 1)]?.id ?? null);
    };

    const move = (id: string, toIndex: number) => {
        setImages((prev) => {
            const from = prev.findIndex((i) => i.id === id);
            if (from < 0 || toIndex < 0 || toIndex >= prev.length || from === toIndex) return prev;
            const copy = [...prev];
            const [item] = copy.splice(from, 1);
            copy.splice(toIndex, 0, item);
            return copy;
        });
    };

    // Drop photos anywhere on this step to add them.
    const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");
    const dropProps = {
        onDragOver: (e: React.DragEvent) => {
            if (!isFileDrag(e)) return;
            e.preventDefault();
            setDropping(true);
        },
        onDragLeave: (e: React.DragEvent) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDropping(false);
        },
        onDrop: (e: React.DragEvent) => {
            setDropping(false);
            if (!isFileDrag(e)) return;
            e.preventDefault();
            addFiles(e.dataTransfer.files);
        },
    };

    const fileInput = (
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = ""; // lets you pick the same photo again
            }}
        />
    );

    // ---------- Empty state ----------
    if (!active) {
        return (
            <div
                {...dropProps}
                onClick={openPicker}
                className={`w-full max-w-[560px] mx-auto aspect-[4/3] sm:aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer transition-colors ${
                    dropping ? "border-black bg-gray-200" : "border-gray-300 bg-gray-50 hover:bg-gray-200/60"
                }`}
            >
                {fileInput}
                {busy ? (
                    <>
                        <Loader size={8} color="text-gray-700" />
                        <p className="text-sm text-gray-600">Preparing photos...</p>
                    </>
                ) : (
                    <>
                        <div className="rounded-full bg-gray-200 p-4">
                            <ImagePlus className="size-8 text-gray-700" />
                        </div>
                        <p className="text-lg font-semibold">Drag photos here</p>
                        <Button type="button" onClick={(e) => { e.stopPropagation(); openPicker(); }}>
                            Select from device
                        </Button>
                        <p className="text-xs text-gray-500 max-w-xs">
                            Up to {MAX_IMAGES} photos. JPG, PNG, WEBP or HEIC, max {MAX_FILE_MB} MB each.
                        </p>
                    </>
                )}
            </div>
        );
    }

    // ---------- Cropper ----------
    return (
        <div {...dropProps} className="relative flex flex-col gap-4 w-full max-w-[560px] mx-auto">
            {fileInput}

            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                {canCrop ? (
                <Cropper
                    key={active.id}
                    image={active.url}
                    crop={active.crop}
                    zoom={active.zoom}
                    aspect={shapeValue}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                    showGrid
                    objectFit="contain"
                    style={{ containerStyle: { background: "#e5e7eb" } }}
                    onCropChange={(crop) => update(active.id, { crop })}
                    onZoomChange={(zoom) => update(active.id, { zoom })}
                    onCropComplete={(_: Area, pixels: Area) => update(active.id, { croppedAreaPixels: pixels })}
                />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={active.url}
                        alt={`Photo ${activeIndex + 1}`}
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                )}

                {images.length > 1 && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-xs px-2 py-0.5">
                        {activeIndex + 1} / {images.length}
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => remove(active.id)}
                    aria-label="Remove this photo"
                    className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white p-1.5 shadow cursor-pointer"
                >
                    <Trash2 className="size-4" />
                </button>

                {dropping && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-white font-semibold pointer-events-none">
                        Drop to add photos
                    </div>
                )}
            </div>

            {/* Shape */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {props.perPhotoShape ? (isGif(active) ? "GIFs keep their shape" : "Crop this photo") : "Shape"}
                </span>
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-200 p-1">
                    {ASPECT_OPTIONS.map((o) => {
                        const selected = o.key === shapeKey;
                        return (
                            <button
                                key={o.key}
                                type="button"
                                title={props.perPhotoShape && o.key === "original" ? "No crop" : o.hint}
                                disabled={props.perPhotoShape && isGif(active)}
                                onClick={() => changeShape(o.key)}
                                className={`flex flex-col items-center gap-1 rounded-md py-1.5 text-xs cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    selected ? "bg-white shadow-sm font-semibold" : "text-gray-600 hover:bg-white/60"
                                }`}
                            >
                                <span className="h-5 flex items-center">
                                    {o.value ? (
                                        <span
                                            className={`block border-2 rounded-[3px] ${selected ? "border-black" : "border-gray-500"}`}
                                            style={{ height: o.value >= 1 ? 18 / o.value : 18, width: o.value >= 1 ? 18 : 18 * o.value }}
                                        />
                                    ) : (
                                        <ImageIcon className="size-5" />
                                    )}
                                </span>
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Zoom */}
            {canCrop && (
            <div className="flex items-center gap-3">
                <ZoomOut className="size-4 text-gray-500 shrink-0" />
                <Slider
                    value={[active.zoom]}
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    onValueChange={([zoom]) => update(active.id, { zoom })}
                    className="flex-1"
                    aria-label="Zoom"
                />
                <ZoomIn className="size-4 text-gray-500 shrink-0" />
                <button
                    type="button"
                    onClick={() => update(active.id, { crop: { x: 0, y: 0 }, zoom: 1 })}
                    title="Reset crop"
                    aria-label="Reset crop"
                    className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                    <RotateCcw className="size-4" />
                </button>
            </div>
            )}

            {/* Photos in this post */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Photos {images.length}/{MAX_IMAGES}
                    </span>
                    {images.length > 1 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="hidden sm:inline mr-1">Drag to reorder</span>
                            <button
                                type="button"
                                onClick={() => move(active.id, activeIndex - 1)}
                                disabled={activeIndex === 0}
                                aria-label="Move photo left"
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(active.id, activeIndex + 1)}
                                disabled={activeIndex === images.length - 1}
                                aria-label="Move photo right"
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 px-1">
                    {images.map((img, i) => (
                        <div
                            key={img.id}
                            draggable
                            onDragStart={() => (dragId.current = img.id)}
                            onDragEnter={() => dragId.current && move(dragId.current, i)}
                            onDragOver={(e) => dragId.current && e.preventDefault()}
                            onDragEnd={() => (dragId.current = null)}
                            className={`group relative size-16 shrink-0 rounded-md overflow-hidden cursor-pointer ${
                                img.id === active.id ? "ring-2 ring-black ring-offset-2 ring-offset-gray-100" : "opacity-80 hover:opacity-100"
                            }`}
                            onClick={() => setActiveId(img.id)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    remove(img.id);
                                }}
                                aria-label={`Remove photo ${i + 1}`}
                                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}

                    {images.length < MAX_IMAGES && (
                        <button
                            type="button"
                            onClick={openPicker}
                            disabled={busy}
                            aria-label="Add photos"
                            className="size-16 shrink-0 rounded-md border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-600 hover:border-black hover:text-black cursor-pointer"
                        >
                            {busy ? <Loader size={5} color="text-gray-700" /> : <Plus className="size-5" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
