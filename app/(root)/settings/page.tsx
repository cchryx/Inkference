"use client";

import { useState } from "react";
import { SETTINGS_LINKS } from "@/constants";
import { Settings } from "lucide-react";
import Authentication from "@/components/settings/Authenticaion";
import Profile from "@/components/settings/Profile";

export default function Page() {
    const [activeSection, setActiveSection] = useState("profile");

    return (
        <div className="flex items-center justify-center h-dvh no-drag select-none">
            <div className="bg-gray-100 w-[95%] md:w-[90%] h-[95%] rounded-md flex shadow-md">
                {/* Sidebar */}
                <aside
                    className="
                        group
                        relative
                        w-16
                        lg:w-52
                        hover:w-52
                        transition-all
                        duration-300
                        ease-in-out
                        border-r-2
                        border-gray-200
                        px-2
                        py-6
                        space-y-4
                        overflow-hidden
                    "
                >
                    {/* Top section: Settings icon/text */}
                    <div className="flex items-center px-2 py-2 text-sm rounded-md">
                        <Settings className="w-5 h-5 text-black shrink-0 transition-opacity duration-200" />
                        <span className="ml-3 text-lg font-bold text-gray-800 whitespace-nowrap opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-200">
                            Settings
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-2">
                        {SETTINGS_LINKS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id)}
                                className={`flex items-center w-full px-2 py-2 text-sm rounded-md transition cursor-pointer ${
                                    activeSection === id
                                        ? "bg-gray-200 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span
                                    className={`
                                        ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                                        opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 lg:opacity-100 lg:scale-100
                                    `}
                                >
                                    {label}
                                </span>
                            </button>
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
