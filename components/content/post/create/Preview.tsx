"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

type Props = {
    images: string[];
    aspect: number;
    description: string;
    location: string;
};

/** Shows the post the way people will see it. */
const Preview = ({ images, aspect, description, location }: Props) => {
    const [index, setIndex] = useState(0);
    const count = images.length;

    return (
        <div className="flex flex-col gap-3 w-full max-w-[480px] mx-auto">
            {count > 0 && (
                <div
                    className="relative w-full overflow-hidden rounded-lg bg-gray-200 group"
                    style={{ aspectRatio: aspect }}
                >
                    <div
                        className="flex h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                        {images.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={src}
                                src={src}
                                alt={`Photo ${i + 1}`}
                                className="w-full h-full shrink-0 object-cover"
                            />
                        ))}
                    </div>

                    {count > 1 && (
                        <>
                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIndex(index - 1)}
                                    aria-label="Previous photo"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white p-1.5 shadow cursor-pointer"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                            )}
                            {index < count - 1 && (
                                <button
                                    type="button"
                                    onClick={() => setIndex(index + 1)}
                                    aria-label="Next photo"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white p-1.5 shadow cursor-pointer"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            )}
                            <span className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-0.5">
                                {index + 1}/{count}
                            </span>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`size-1.5 rounded-full ring-1 ring-black/20 ${
                                            i === index ? "bg-white" : "bg-white/60"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {location && (
                <p className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="size-3.5" /> {location}
                </p>
            )}

            <p className="text-sm whitespace-pre-wrap break-words">
                {description || <span className="text-gray-400">No caption</span>}
            </p>
        </div>
    );
};

export default Preview;
