"use client";

import { useEffect, useRef, useState } from "react";
import { SETTINGS_LINKS } from "@/constants";
import Authentication from "@/components/settings/Authenticaion";
import Profile from "@/components/settings/Profile";
import { Settings } from "lucide-react";
import User from "@/components/settings/User";

type Props = {
    accounts: any[];
    hasPassword: boolean;
};

const SettingsWrapper = ({ accounts, hasPassword }: Props) => {
    const [activeSection, setActiveSection] = useState("profile");
    const [showMobileLabel, setShowMobileLabel] = useState(false);
    const [isSlidingOut, setIsSlidingOut] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const menuOverlayRef = useRef<HTMLDivElement>(null);
    const holdTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                slideInAndHideLabel();
            }

            if (
                showMobileMenu &&
                menuOverlayRef.current &&
                !menuOverlayRef.current.contains(event.target as Node)
            ) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMobileMenu]);

    const slideInAndHideLabel = () => {
        setIsSlidingOut(true);
        setTimeout(() => {
            setShowMobileLabel(false);
            setIsSlidingOut(false);
        }, 300);
    };

    const handleSelect = (id: string) => {
        setActiveSection(id);
        setShowMobileLabel(false);
        setIsSlidingOut(false);
        setShowMobileMenu(false);
        setTimeout(() => setShowMobileLabel(true), 10);
        setTimeout(() => slideInAndHideLabel(), 1500);
    };

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
        <div className="flex flex-col h-full">
            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
                <div
                    onClick={() => setShowMobileMenu(true)}
                    className="w-6 h-6 text-gray-700 flex items-center justify-center cursor-pointer"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </div>
                <div className="text-sm font-semibold capitalize">
                    <Settings className="w-4 h-4 inline-block mr-1" />
                    {activeSection}
                </div>
                <div className="w-6 h-6" />
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center h-full no-drag select-none pt-10 md:pt-0">
                <div className="bg-gray-100 w-[95%] md:w-[90%] h-[95%] rounded-md flex shadow-md">
                    {/* Sidebar */}
                    <div
                        ref={sidebarRef}
                        className="hidden md:flex flex-col w-16 lg:w-52 border-r-2 border-gray-200 px-2 py-6 space-y-2 overflow-visible relative transition-all duration-300"
                    >
                        <div className="flex items-center justify-center lg:justify-start px-2 mb-8">
                            <div className="flex items-center gap-2 font-bold text-gray-600 text-lg lg:text-xl">
                                <Settings className="w-6 h-6 shrink-0" />
                                <div className="hidden lg:block">Settings</div>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
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
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <div className="hidden lg:block ml-3 truncate text-sm">
                                        {label}
                                    </div>

                                    {activeSection === id &&
                                        showMobileLabel && (
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
                        </div>
                    </div>

                    {/* Section Content */}
                    <div className="flex-1 p-6 pt-6 overflow-y-scroll no-scrollbar">
                        <div className="hidden md:block text-xl font-semibold capitalize">
                            {activeSection}
                        </div>
                        <div className="mt-4">
                            {activeSection === "profile" && <Profile />}
                            {activeSection === "user" && <User />}
                            {activeSection === "authentication" && (
                                <Authentication
                                    accounts={accounts}
                                    hasPassword={hasPassword}
                                />
                            )}
                            {activeSection === "relations" && (
                                <div>Relations settings</div>
                            )}
                            {activeSection === "notifications" && (
                                <div>Notifications settings</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Bottom Menu (Mobile Only) */}
            <div
                className={`fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
                    showMobileMenu
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
            >
                <div
                    ref={menuOverlayRef}
                    className={`w-full bg-white rounded-t-2xl pt-4 pb-6 px-4 shadow-lg transform transition-transform duration-300 ease-out ${
                        showMobileMenu ? "translate-y-0" : "translate-y-full"
                    } max-h-[60vh] overflow-y-auto`}
                >
                    <div className="flex justify-between items-center pb-3 border-b">
                        <div className="font-semibold text-gray-800 text-base">
                            <Settings className="inline-block mr-1" /> Settings
                        </div>
                        <div
                            onClick={() => setShowMobileMenu(false)}
                            className="cursor-pointer w-4 h-4 relative"
                        >
                            <div className="absolute w-full h-0.5 bg-black rotate-45 top-1/2 left-0" />
                            <div className="absolute w-full h-0.5 bg-black -rotate-45 top-1/2 left-0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {SETTINGS_LINKS.map(({ id, label, icon: Icon }) => (
                            <div
                                key={id}
                                onClick={() => handleSelect(id)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm text-gray-800 cursor-pointer transition"
                            >
                                <Icon className="w-4 h-4" />
                                <div>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsWrapper;
