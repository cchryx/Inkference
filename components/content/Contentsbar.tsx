"use client";

import { useEffect, useRef, useState } from "react";
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

    useEffect(() => {
        if (visibleLabel) {
            const timeout = setTimeout(() => setVisibleLabel(null), 3000);
            return () => clearTimeout(timeout);
        }
    }, [visibleLabel]);

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
                                    onClick={() => {
                                        setActive(link.id);
                                        setVisibleLabel(link.id);
                                    }}
                                    className="group flex flex-col items-center text-gray-800 cursor-pointer"
                                >
                                    <link.icon
                                        className={`w-5 h-5 transition-colors duration-300 ${
                                            isActive
                                                ? "text-black"
                                                : "text-gray-600 group-hover:text-black"
                                        }`}
                                    />

                                    {/* Desktop label (inline) */}
                                    <span className="hidden sm:inline text-xs mt-1 text-gray-600 group-hover:text-black transition-colors duration-300">
                                        {link.label}
                                    </span>

                                    {/* Mobile tooltip bubble label */}
                                    {isLabelVisible && (
                                        <div className="sm:hidden absolute top-full mt-2 px-2 py-1 text-xs bg-gray-200 rounded-full whitespace-nowrap shadow-lg animate-fade-in-out z-50">
                                            {link.label}
                                        </div>
                                    )}

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
