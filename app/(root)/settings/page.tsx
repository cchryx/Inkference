"use client";

import { useEffect, useRef, useState } from "react";
import { SETTINGS_LINKS } from "@/constants";
import Authentication from "@/components/settings/Authenticaion";
import Profile from "@/components/settings/Profile";
import { Settings } from "lucide-react";

export default function Page() {
    const [activeSection, setActiveSection] = useState("profile");
    const [showMobileLabel, setShowMobileLabel] = useState(false);
    const [isSlidingOut, setIsSlidingOut] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const holdTimeout = useRef<NodeJS.Timeout | null>(null);

    // Outside click to hide
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                slideInAndHideLabel();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const slideInAndHideLabel = () => {
        setIsSlidingOut(true);
        setTimeout(() => {
            setShowMobileLabel(false);
            setIsSlidingOut(false);
        }, 300); // match transition duration
    };

    const handleSelect = (id: string) => {
        setActiveSection(id);
        setShowMobileLabel(false);
        setIsSlidingOut(false);

        setTimeout(() => setShowMobileLabel(true), 10);
        setTimeout(() => slideInAndHideLabel(), 1500);
    };

    // Handle long press for showing label without navigation
    const handleHoldStart = (id: string) => {
        holdTimeout.current = setTimeout(() => {
            setActiveSection(id);
            setShowMobileLabel(true);
            setIsSlidingOut(false);
            setTimeout(() => slideInAndHideLabel(), 1500);
        }, 500);
    };

    const handleHoldEnd = () => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
            holdTimeout.current = null;
        }
    };

    return (
        <div className="flex items-center justify-center h-full no-drag select-none">
            <div className="bg-gray-100 w-[95%] md:w-[90%] h-[95%] rounded-md flex shadow-md">
                {/* Sidebar */}
                <aside
                    ref={sidebarRef}
                    className="w-16 lg:w-52 border-r-2 border-gray-200 px-2 py-6 space-y-2 overflow-visible relative"
                >
                    {/* Settings Header */}
                    <div className="flex items-center justify-center lg:justify-start px-2 mb-8">
                        <div className="flex items-center gap-2 font-bold text-gray-600 text-lg lg:text-xl">
                            <Settings className="w-6 h-6 shrink-0" />
                            <span className="hidden lg:block">Settings</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-2 relative">
                        {SETTINGS_LINKS.map(({ id, label, icon: Icon }) => (
                            <div
                                key={id}
                                onClick={() => handleSelect(id)}
                                onMouseDown={() => handleHoldStart(id)}
                                onTouchStart={() => handleHoldStart(id)}
                                onMouseUp={handleHoldEnd}
                                onMouseLeave={handleHoldEnd}
                                onTouchEnd={handleHoldEnd}
                                className={`relative flex items-center justify-center lg:justify-start w-full px-2 py-2 rounded-md cursor-pointer ${
                                    activeSection === id
                                        ? "bg-gray-200 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                {/* Icon */}
                                <Icon className="w-5 h-5 shrink-0" />

                                {/* Desktop label */}
                                <div className="hidden lg:block ml-3 truncate text-sm">
                                    {label}
                                </div>

                                {/* Mobile slide-out bubble */}
                                {activeSection === id && showMobileLabel && (
                                    <div
                                        className={`lg:hidden absolute left-[110%] top-1/2 -translate-y-1/2 bg-gray-200 text-[10px] sm:text-xs px-3 py-1 rounded-sm shadow-md whitespace-nowrap z-10 transition-all duration-300 ease-out ${
                                            isSlidingOut
                                                ? "opacity-0 -translate-x-4"
                                                : "opacity-100 translate-x-0"
                                        }`}
                                    >
                                        {label}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <section className="flex-1 p-6 overflow-y-scroll no-scrollbar">
                    <h3 className="text-xl font-semibold capitalize">
                        {activeSection}
                    </h3>
                    <div className="mt-4">
                        {activeSection === "profile" && <Profile />}
                        {activeSection === "authentication" && (
                            <Authentication />
                        )}
                        {activeSection === "relations" && (
                            <p>Relations settings</p>
                        )}
                        {activeSection === "notifications" && (
                            <p>Notifications settings</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
