"use client";

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
    if (active !== "projects") return null;

    return (
        <div className="flex flex-col items-center justify-center">
            {isProjectsLoading && <Loader size={10} color="black" />}

            {/* When search is empty */}
            {!search && (
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
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            width="w-full"
                            height="h-[400px]"
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasNextPage && projects.length > 0 && (
                <button
                    disabled={isFetchingNextPage}
                    onClick={fetchNextPage}
                    className="mt-6 px-4 py-2 bg-gray-200 rounded"
                >
                    {isFetchingNextPage ? "Loading more..." : "Load more"}
                </button>
            )}
        </div>
    );
};

export default ProjectSearchResult;
