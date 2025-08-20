"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

type SubnavbarProps<T extends string> = {
    categories: { key: T; label: string }[];
    active: T;
    setActive: (value: T) => void;
    className?: string;
};

const Subnavbar = <T extends string>({
    categories,
    active,
    setActive,
    className = "",
}: SubnavbarProps<T>) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    useEffect(() => {
        const checkFade = () => {
            const el = containerRef.current;
            if (!el) return;
            setShowLeftFade(el.scrollLeft > 0);
            setShowRightFade(
                el.scrollWidth > el.clientWidth + el.scrollLeft + 1
            );
        };

        const el = containerRef.current;
        if (!el) return;
        checkFade();

        el.addEventListener("scroll", checkFade);
        window.addEventListener("resize", checkFade);

        return () => {
            el.removeEventListener("scroll", checkFade);
            window.removeEventListener("resize", checkFade);
        };
    }, []);

    return (
        <div className={`relative select-none ${className}`}>
            {/* Left Fade */}
            {showLeftFade && (
                <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white/90 to-transparent z-10" />
            )}
            {/* Right Fade */}
            {showRightFade && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/90 to-transparent z-10" />
            )}

            <div
                ref={containerRef}
                className="flex overflow-x-auto no-scrollbar gap-2 px-1 sm:px-2 scroll-smooth"
            >
                {categories.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => {
                            router.refresh(), setActive(key);
                        }}
                        className={`shrink-0 text-sm sm:text-base font-medium px-3 py-1 rounded-full transition cursor-pointer ${
                            active === key
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Subnavbar;
