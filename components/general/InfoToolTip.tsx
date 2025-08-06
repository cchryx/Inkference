"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
    text: string;
    position?: "top" | "right" | "bottom" | "left";
};

const InfoTooltip = ({ text, position = "right" }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
        right: "left-6 top-1/2 -translate-y-1/2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
        left: "right-6 top-1/2 -translate-y-1/2",
    };

    // Close tooltip on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="text-gray-500 hover:text-black"
            >
                <Info className="w-4 h-4 cursor-pointer" />
            </button>

            {isOpen && (
                <div
                    ref={tooltipRef}
                    className={`
                        absolute z-50 rounded bg-gray-200 px-2 py-1 text-xs text-black shadow transition
                        ${positionClasses[position]}
                        max-w-[200px] 
                        lg:max-w-[250px] 
                        whitespace-normal  
                        break-words  
                        w-max 
                    `}
                >
                    {text}
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;
