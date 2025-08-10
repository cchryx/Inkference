"use client";

import React, { useState } from "react";
import { GetStartedButton } from "@/components/auth/GetStartedButton";

interface Slide {
    title: string;
    description: React.ReactNode;
}

interface Props {
    userCount: number;
    projectCount: number;
}

const WelcomeWrapper = ({ userCount, projectCount }: Props) => {
    const slides: Slide[] = [
        {
            title: "Welcome to Inkference",
            description: (
                <>
                    We currently have <strong>{userCount}</strong> users and{" "}
                    <strong>{projectCount}</strong> projects posted. Inkference
                    is the perfect place to showcase your skills and connect
                    with other creators.
                </>
            ),
        },
        {
            title: "Showcase Your Work",
            description:
                "Add experiences, education, skills, and share your progress.",
        },
        {
            title: "Join the Community",
            description: "Chat, follow others, and get inspired by new posts.",
        },
    ];

    const [current, setCurrent] = useState(0);

    return (
        <div
            className="relative flex flex-col items-center justify-center w-full h-dvh px-4 sm:px-6 text-white bg-cover bg-center"
            style={{
                backgroundImage: "url('/assets/welcome/welcomeBg.jpg')",
            }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 z-0" />

            {/* Glass container */}
            <div className="relative z-10 w-full max-w-md sm:max-w-xl bg-white/10 backdrop-blur-md rounded-lg p-6 sm:p-8 text-center space-y-4 sm:space-y-6 border border-white/20 shadow-lg">
                <h1 className="text-4xl sm:text-6xl font-extrabold select-none text-white drop-shadow-md">
                    Inkference
                </h1>

                <h2 className="text-2xl sm:text-4xl font-semibold text-white drop-shadow-md">
                    {slides[current].title}
                </h2>

                <p className="text-base sm:text-lg text-white drop-shadow-md">
                    {slides[current].description}
                </p>

                {/* Dots */}
                <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full cursor-pointer ${
                                i === current ? "bg-white" : "bg-white/50"
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                <div className="mt-6 sm:mt-10">
                    <GetStartedButton />
                </div>
            </div>
        </div>
    );
};

export default WelcomeWrapper;
