"use client";

import { PROFILE_LINKS } from "@/constants";
import { useState } from "react";
import Projects from "./sections/Projects";
import Experiences from "./sections/Experiences";
import Education from "./sections/Education";
import Photos from "./sections/Photos";
import Skills from "./sections/Skills";
import Posts from "./sections/Posts";

const ProfileContent = ({ tUser }: { tUser: any }) => {
    const [active, setActive] = useState("projects");

    return (
        <div className="w-full">
            {/* Profile content menu */}
            <div className="sticky top-0 z-40 bg-gray-200 rounded-md shadow-md">
                <div className="w-full p-2 flex justify-center">
                    <div className="flex gap-6 md:gap-10">
                        {PROFILE_LINKS.map((link) => {
                            const isActive = active === link.id;

                            return (
                                <button
                                    key={link.id}
                                    onClick={() => setActive(link.id)}
                                    className="group relative flex flex-col items-center text-gray-800 cursor-pointer"
                                >
                                    <link.icon
                                        className={`w-5 h-5 mb-1 transition-colors duration-300 ${
                                            isActive
                                                ? "text-black"
                                                : "text-gray-600 group-hover:text-black"
                                        }`}
                                    />
                                    <span
                                        className={`text-xs transition-colors duration-300 ${
                                            isActive
                                                ? "text-black"
                                                : "text-gray-600 group-hover:text-black"
                                        }`}
                                    >
                                        {link.label}
                                    </span>
                                    <div
                                        className={`absolute -bottom-1 h-0.5 w-6 rounded-full bg-black transition-all duration-300 ${
                                            isActive
                                                ? "opacity-100 scale-100"
                                                : "opacity-0 scale-50 group-hover:opacity-50 group-hover:scale-100"
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable content below */}
            {active === "projects" && <Projects />}
            {active === "experiences" && <Experiences />}
            {active === "education" && <Education />}
            {active === "skills" && <Skills />}
            {active === "photos" && <Photos />}
            {active === "posts" && <Posts />}
        </div>
    );
};

export default ProfileContent;
