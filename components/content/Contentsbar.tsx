"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PROFILE_LINKS } from "@/constants";

const ContentsBar = ({
    active,
    setActive,
}: {
    active: string;
    setActive: React.Dispatch<React.SetStateAction<string>>;
}) => {
    const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setVisibleLabel(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    // Auto-hide mobile tooltip after delay
    useEffect(() => {
        if (visibleLabel) {
            const timeout = setTimeout(() => setVisibleLabel(null), 3000);
            return () => clearTimeout(timeout);
        }
    }, [visibleLabel]);

    // On mount → sync from search param if exists
    useEffect(() => {
        const section = searchParams.get("section");
        if (section && PROFILE_LINKS.some((link) => link.id === section)) {
            setActive(section);

            // Clean the URL (remove ?section=) but keep state
            const params = new URLSearchParams(searchParams.toString());
            params.delete("section");

            const query = params.toString();
            const url = query ? `?${query}` : "";

            router.replace(url, { scroll: false });
        }
    }, [searchParams, setActive, router]);

    const handleClick = (id: string) => {
        setActive(id);
        setVisibleLabel(id);

        const params = new URLSearchParams(searchParams.toString());
        if (params.has("section")) {
            params.delete("section");
            const query = params.toString();
            const url = query ? `?${query}` : "";
            router.replace(url, { scroll: false });
        }
    };

    return (
        <div
            ref={containerRef}
            className="sticky top-0 z-40 bg-gray-200 rounded-md shadow-md select-none"
        >
            <div className="w-full p-2 flex justify-center">
                <div className="flex gap-6 md:gap-10">
                    {PROFILE_LINKS.map((link) => {
                        const isActive = active === link.id;
                        const isLabelVisible = visibleLabel === link.id;

                        return (
                            <div key={link.id} className="relative">
                                <button
                                    onClick={() => handleClick(link.id)}
                                    className="group flex flex-col items-center text-gray-800 cursor-pointer"
                                >
                                    <link.icon
                                        className={`w-5 h-5 transition-colors duration-300 ${
                                            isActive
                                                ? "text-black"
                                                : "text-gray-600 group-hover:text-black"
                                        }`}
                                    />

                                    {/* Desktop label */}
                                    <span className="hidden sm:inline text-xs mt-1 text-gray-600 group-hover:text-black transition-colors duration-300">
                                        {link.label}
                                    </span>

                                    {/* Mobile tooltip bubble */}
                                    {isLabelVisible && (
                                        <div className="sm:hidden absolute top-full mt-2 px-2 py-1 text-xs bg-gray-200 rounded-full whitespace-nowrap shadow-lg animate-fade-in-out z-50">
                                            {link.label}
                                        </div>
                                    )}

                                    {/* Active underline */}
                                    <div
                                        className={`absolute -bottom-1 h-0.5 w-6 rounded-full bg-black transition-all duration-300 ${
                                            isActive
                                                ? "opacity-100 scale-100"
                                                : "opacity-0 scale-50 group-hover:opacity-50 group-hover:scale-100"
                                        }`}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ContentsBar;
