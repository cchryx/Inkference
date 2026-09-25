"use client";

import { useState } from "react";
import { NAVBARLEFT_LINKS } from "@/constants";

const STATEMENTS = [
    "A day on Venus is longer than a year on Venus.",
    "Neutron stars can spin 600 times per second.",
    "There are more stars in the universe than grains of sand on Earth.",
    "Jupiter’s Great Red Spot is a storm that has raged for at least 350 years.",
    "Space is completely silent — no atmosphere to carry sound.",
    "The footprints on the Moon will stay there for millions of years.",
    "Saturn’s rings are made mostly of ice particles with some rock.",
    "A teaspoon of neutron star material would weigh about 6 billion tons.",
    "The largest volcano in the solar system is Olympus Mons on Mars.",
    "One day on Mercury lasts 59 Earth days.",
    "There are more stars in the universe than grains of sand on all Earth’s beaches.",
    "The Sun contains 99.86% of the total mass of the Solar System.",
    "If the Milky Way’s stars were grains of sand, you’d need over 100 billion planets to hold them all.",
    "There are over 100 billion galaxies in the observable universe.",
    "Neutron stars pack more mass than the Sun into a sphere only 20 km wide.",
    "A light-year is about 9.46 trillion kilometers.",
    "Jupiter’s Great Red Spot could fit three Earths inside it.",
    "The Milky Way rotates at about 828,000 km/h.",
    "There are more atoms in a single teaspoon of water than stars in the Milky Way.",
    "The observable universe is 93 billion light-years across.",
];

/** Full-area loading screen (chill cat + space fact). */
export default function PageLoader({ pathname }: { pathname: string }) {
    const [statement] = useState(
        () => STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)]
    );

    const matchedLink = NAVBARLEFT_LINKS.find((link) =>
        link.route === "/" ? pathname === "/" : pathname.startsWith(link.route)
    );

    const segment = pathname.split("/")[2] || "";
    const pageTitle = pathname.startsWith("/profile/")
        ? `Profile: @${decodeURIComponent(segment)}`
        : pathname.startsWith("/project/")
        ? "Project"
        : pathname.startsWith("/gallery/")
        ? "Gallery"
        : pathname.startsWith("/post/")
        ? "Post"
        : matchedLink?.label || "";

    const loadingText = pathname.startsWith("/profile/")
        ? "Loading profile data..."
        : pathname.startsWith("/project/")
        ? "Loading project..."
        : pathname.startsWith("/gallery/")
        ? "Loading gallery..."
        : pathname.startsWith("/post/")
        ? "Loading post..."
        : pathname === "/"
        ? "Loading home page feeds..."
        : matchedLink?.label
        ? `Loading ${matchedLink.label.toLowerCase()} data...`
        : "Loading...";

    return (
        <div className="flex flex-col items-center justify-center bg-white/90 h-full w-full p-4">
            {/* Chill Cat Loader */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/assets/icons/chillCat.png"
                alt="Chill Cat"
                className="mb-4 animate-bounce w-50 md:w-100"
            />

            {/* Page Title */}
            <h1 className="mb-1 text-xl font-semibold text-gray-800">{pageTitle}</h1>

            {/* Space Statement */}
            <p className="mb-2 text-sm text-gray-500 italic text-center">{statement}</p>

            {/* Loading Text */}
            <p className="animate-pulse text-lg">{loadingText}</p>
        </div>
    );
}
