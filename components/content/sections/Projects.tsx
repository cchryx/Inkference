import ProjectCard from "../cards/ProjectCard";

type Props = {
    projects: any[];
    rootUser?: boolean;
    category?: string;
};

const Projects = ({ projects, rootUser = false, category }: Props) => {
    const getEmptyMessage = (cat?: string) => {
        switch (cat) {
            case "myProjects":
                return "You have not created any projects yet. You can try creating one now.";
            case "contributedTo":
                return "You haven’t contributed to any projects yet.";
            case "saved":
                return "You haven’t saved any projects yet.";
            case "liked":
                return "You haven’t liked any projects yet.";
            case "viewed":
                return "You haven’t viewed any projects yet.";
            default:
                return "No projects to display.";
        }
    };

    if (!projects || projects.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not uploaded any projects yet."
                    : getEmptyMessage(category)}
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
