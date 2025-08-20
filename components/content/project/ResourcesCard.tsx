"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../../general/Skeleton";
import { ChevronDown, ChevronRight, Link2, Pen, Pencil } from "lucide-react";
import EditResourcesModal from "./edit/EditResourcesModal";

type Props = {
    isOwner: boolean;
    projectId: string;
    resources: any;
};

const ResourcesCard = ({ isOwner, projectId, resources }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleMinimize = () => setIsMinimized((prev) => !prev);

    if (isLoading) {
        return (
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-[30%] h-6 rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full rounded-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <EditResourcesModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                projectId={projectId}
                initialResources={resources}
            />
            <div className="bg-gray-200 p-3 shadow-md rounded-md w-full flex flex-col gap-2 max-h-[300px]">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <h2 className="text-lg font-semibold">
                            Project Resources ({resources.length})
                        </h2>
                        {isOwner && (
                            <button
                                onClick={() => setEditOpen(true)}
                                className="flex cursor-pointer items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={toggleMinimize}
                        className="text-gray-600 hover:text-black transition cursor-pointer"
                    >
                        {isMinimized ? (
                            <ChevronRight className="size-6" />
                        ) : (
                            <ChevronDown className="size-6" />
                        )}
                    </button>
                </div>

                {!isMinimized && resources.length > 0 && (
                    <div className="overflow-y-auto flex flex-col gap-2 pr-1 yes-scrollbar text-sm">
                        {resources.map((url: string, index: number) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 hover:brightness-90 bg-gray-300 px-2 py-1 rounded-sm cursor-pointer w-full"
                            >
                                <Link2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate overflow-hidden whitespace-nowrap w-full text-gray-800">
                                    {url}
                                </span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default ResourcesCard;
