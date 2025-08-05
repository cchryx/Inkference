"use client";

import { useEffect, useState } from "react";

type LinkItem = {
    id: string;
    label: string;
};

type TopBarProps = {
    active: string;
    setActive: React.Dispatch<React.SetStateAction<string>>;
    links: LinkItem[];
};

const Topbar = ({ active, setActive, links }: TopBarProps) => {
    return (
        <div className="bg-gray-200 md:bg-gray-300 shadow-md w-full relative fixed">
            <div className="p-3 flex justify-center">
                <div className="flex gap-8 md:gap-10">
                    {links.map(({ id, label }) => {
                        const isActive = active === id;

                        return (
                            <div key={id} className="relative">
                                <button
                                    onClick={() => setActive(id)}
                                    className={`group flex flex-col items-center cursor-pointer text-sm ${
                                        isActive
                                            ? "font-semibold text-black"
                                            : "font-normal text-gray-600 hover:text-black"
                                    }`}
                                >
                                    <span>{label}</span>
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

export default Topbar;
