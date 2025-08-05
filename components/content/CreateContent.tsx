"use client";

import { Plus } from "lucide-react";

type Props = {
    label: string;
    onClick?: () => void;
};

const CreateContent = ({ label, onClick }: Props) => {
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden border border-gray-200 mt-5 rounded-xl shadow-sm py-3 md:py-5 flex items-center justify-center group transition-all duration-300 ease-in-out ${
                onClick ? "cursor-pointer hover:shadow-md" : ""
            }`}
        >
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 opacity-90 pointer-events-none" />

            <div className="flex items-center gap-3 z-10 transition-transform duration-300 ease-in-out group-hover:scale-105">
                <div className="bg-gray-100 text-black rounded-md p-1 shadow-sm">
                    <Plus className="w-5 h-5" />
                </div>
                <div className="text-md font-medium text-gray-800">
                    {label
                        .toLowerCase()
                        .replace(/^./, (char) => char.toUpperCase())}
                </div>
            </div>
        </div>
    );
};

export default CreateContent;
