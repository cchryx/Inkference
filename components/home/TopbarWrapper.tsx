"use client";

import { useState } from "react";
import { HOMETOP_LINKS } from "@/constants";
import Topbar from "../root/Topbar";

const TopbarWrapper = () => {
    const [active, setActive] = useState("for_you");

    const contentList = Array.from({ length: 10 }).map((_, i) => ({
        key: `${active}-${i}`,
        label: `${active === "for_you" ? "For You" : "Following"} - Box ${
            i + 1
        }`,
        bgClass:
            active === "for_you"
                ? "bg-blue-200 text-blue-900"
                : "bg-green-200 text-green-900",
    }));

    return (
        <>
            <Topbar
                active={active}
                setActive={setActive}
                links={HOMETOP_LINKS}
            />

            <div className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar h-full">
                {contentList.map((item) => (
                    <div
                        key={item.key}
                        className={`snap-start h-full w-full flex items-center justify-center ${item.bgClass}`}
                    >
                        <div className="w-[90%] md:w-[40%] h-[80%] bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-semibold">
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default TopbarWrapper;
