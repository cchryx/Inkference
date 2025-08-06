"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SOCIALNAVBAR_LINKS } from "@/constants";

const SocialnavbarMobile = () => {
    const pathname = usePathname();
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // Auto-hide tooltip after 3 seconds
    useEffect(() => {
        if (activeTooltip) {
            const timer = setTimeout(() => {
                setActiveTooltip(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [activeTooltip]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                navRef.current &&
                !navRef.current.contains(event.target as Node)
            ) {
                setActiveTooltip(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    return (
        <div
            ref={navRef}
            className="bg-gray-200 z-30 md:hidden py-2 px-3 select-none"
        >
            <ul className="flex justify-center gap-4">
                {SOCIALNAVBAR_LINKS.map((link) => {
                    const isActive = pathname === link.route;
                    const Icon = link.icon;
                    const isTooltipVisible = activeTooltip === link.label;

                    return (
                        <li
                            key={link.label}
                            className={`group relative rounded-lg transition bg-gray-200 ${
                                isActive
                                    ? "brightness-[90%]"
                                    : "hover:brightness-[90%]"
                            }`}
                        >
                            <Link
                                href={link.route}
                                onClick={(e) => {
                                    setActiveTooltip(link.label);

                                    if (pathname === link.route) {
                                        e.preventDefault();
                                    }
                                }}
                                className="relative flex flex-col items-center p-2"
                            >
                                <Icon className="size-5 transition" />
                                <span
                                    className={`absolute bg-gray-200 top-full mt-2 text-xs py-1 px-2 rounded-lg shadow-lg 
                                        transition-all duration-200 
                                        ${
                                            isTooltipVisible
                                                ? "opacity-100 pointer-events-auto"
                                                : "opacity-0 pointer-events-none"
                                        }`}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {link.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SocialnavbarMobile;
