import ProjectCard from "../cards/ProjectCard";

type Props = {
    projects: any[];
    rootUser?: boolean;
};

const Projects = ({ projects, rootUser = false }: Props) => {
    if (!projects || projects.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md">
                {!rootUser
                    ? "This profile has not uploaded any projects yet."
                    : "You have not created any projects yet. You can try creating one right now."}
            </div>
        );
    }

    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 select-none">
            {projects.map((p: any, i: number) => (
                <ProjectCard key={p.id ?? i} project={p} />
            ))}
        </div>
    );
};

export default Projects;
