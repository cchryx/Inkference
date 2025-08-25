"use client";

import { useEffect, useRef } from "react";
import ProjectCard from "../content/cards/ProjectCard";
import Loader from "../general/Loader";

type Props = {
    active: string;
    projects: any[];
    search: string;
    isProjectsLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
};

const ProjectSearchResult = ({
    active,
    projects,
    search,
    isProjectsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: Props) => {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasNextPage || !loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "150px" }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (active !== "projects") return null;

    return (
        <div className="flex flex-col items-center justify-center overflow-y-scroll no-scrollbar">
            {/* Initial loading */}
            {isProjectsLoading && projects.length === 0 && (
                <div className="flex justify-center mt-10">
                    <Loader size={10} color="black" />
                </div>
            )}

            {/* When search is empty */}
            {!search && !isProjectsLoading && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    <img
                        src="/assets/icons/searchBear.png"
                        alt="Search prompt"
                        className="w-32 h-32 mb-4 object-cover"
                    />
                    <p className="text-lg font-medium">
                        Start typing to search for projects.
                    </p>
                </div>
            )}

            {/* When search has no results */}
            {search && !isProjectsLoading && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    <img
                        src="/assets/icons/searchBear.png"
                        alt="No projects"
                        className="w-32 h-32 mb-4 object-cover"
                    />
                    <p className="text-lg font-medium">No projects found.</p>
                </div>
            )}

            {/* Results */}
            {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                    {projects.map((project, index) => (
                        <ProjectCard
                            key={index}
                            project={project}
                            width="w-full"
                            height="h-[400px]"
                        />
                    ))}
                </div>
            )}

            {/* Loader + sentinel for infinite scroll */}
            {(isFetchingNextPage || hasNextPage) && (
                <div ref={loadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage && <Loader size={10} color="black" />}
                </div>
            )}

            {/* End of results */}
            {!hasNextPage && projects.length > 0 && (
                <div className="text-center py-6 text-gray-400">
                    That’s all the projects we found.
                </div>
            )}
        </div>
    );
};

export default ProjectSearchResult;
