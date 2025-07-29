"use client";

import { PROFILE_LINKS } from "@/constants";
import { useEffect, useRef, useState } from "react";
import Projects from "../profile/sections/Projects";
import Experiences from "../profile/sections/Experiences";
import Education from "../profile/sections/Education";
import Photos from "../profile/sections/Photos";
import Skills from "../profile/sections/Skills";
import Posts from "../profile/sections/Posts";
import CreateContent from "../create/CreateContent";
import CreateProjectModal from "../create/CreateProjectModal";

type Props = {
    tUser: any;
    rootUser?: boolean; // ← add rootUser prop
};

const ProfileContent = ({ tUser, rootUser = false }: Props) => {
    const [active, setActive] = useState("projects");
    const [showLabel, setShowLabel] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState<"project" | null>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    // Hide bubble after 3s or on outside click
    useEffect(() => {
        if (!showLabel) return;

        const timeout = setTimeout(() => {
            setShowLabel(null);
        }, 3000);

        const handleClickOutside = (e: MouseEvent) => {
            if (
                bubbleRef.current &&
                !bubbleRef.current.contains(e.target as Node)
            ) {
                setShowLabel(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showLabel]);

    return (
        <div className="w-full">
            {/* Sticky menu bar */}
            <div className="sticky top-0 z-40 bg-gray-200 rounded-md shadow-md">
                <div className="w-full p-2 flex justify-center">
                    <div className="flex gap-8 md:gap-10">
                        {PROFILE_LINKS.map((link) => {
                            const isActive = active === link.id;

                            return (
                                <div key={link.id} className="relative">
                                    <button
                                        onClick={() => {
                                            setActive(link.id);
                                            setShowLabel(link.id);
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
                                        <span className="hidden sm:inline text-xs mt-1 text-gray-600 group-hover:text-black transition-colors duration-300">
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

                                    {showLabel === link.id && (
                                        <div
                                            ref={bubbleRef}
                                            className="md:hidden absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-xs rounded-full shadow transition-opacity duration-300 opacity-100"
                                        >
                                            {link.label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Content below */}
            {active === "projects" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Projects"
                                onClick={() => setOpenModal("project")}
                            />

                            {openModal === "project" && (
                                <CreateProjectModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Projects tUser={tUser} />
                </>
            )}
            {active === "experiences" && <Experiences />}
            {active === "education" && <Education />}
            {active === "skills" && <Skills />}
            {active === "photos" && <Photos />}
            {active === "posts" && <Posts />}
        </div>
    );
};

export default ProfileContent;
