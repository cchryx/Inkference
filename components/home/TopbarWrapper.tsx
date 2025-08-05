"use client";

import { useState } from "react";
import { HOMETOP_LINKS } from "@/constants";
import Topbar from "../root/Topbar";

const TopbarWrapper = () => {
    const [active, setActive] = useState("for_you");

    return (
        <>
            <Topbar
                active={active}
                setActive={setActive}
                links={HOMETOP_LINKS}
            />
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {active === "for_you" &&
                    Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={`for-you-${i}`}
                            className="h-32 bg-blue-200 rounded-lg shadow-md flex items-center justify-center text-xl font-semibold text-blue-900"
                        >
                            For You - Box {i + 1}
                        </div>
                    ))}

                {active === "following" &&
                    Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={`following-${i}`}
                            className="h-32 bg-green-200 rounded-lg shadow-md flex items-center justify-center text-xl font-semibold text-green-900"
                        >
                            Following - Box {i + 1}
                        </div>
                    ))}
            </div>
        </>
    );
};

export default TopbarWrapper;
