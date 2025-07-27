import ProjectCard from "../ProjectCard";

const randomProjects = [
    {
        bannerUrl: "/assets/general/fillerImage.png",
        name: "Portfolio Website",
        description:
            "A personal portfolio to showcase projects and contact info.",
        status: "In Progress",
        startDate: "01/06/2025",
        endDate: "27/07/2025",
        skills: ["React", "Tailwind", "Next.js"],
        likes: 123,
        views: 456,
        postedAt: "2025-07-20T12:00:00Z",
    },
    {
        bannerUrl: "/assets/general/fillerImage.png",
        name: "E-commerce App",
        description:
            "A full-stack e-commerce platform with Stripe integration.",
        status: "Complete",
        startDate: "01/01/2025",
        endDate: "01/03/2025",
        skills: ["Node.js", "Express", "MongoDB", "Stripe"],
        likes: 230,
        views: 880,
        postedAt: "2025-06-15T10:00:00Z",
    },
    {
        bannerUrl: "/assets/general/fillerImage.png",
        name: "Task Manager",
        description:
            "A productivity app to manage daily tasks and track progress.",
        status: "In Progress",
        startDate: "01/05/2025",
        endDate: "30/09/2025",
        skills: ["Vue", "Firebase", "Tailwind"],
        likes: 90,
        views: 312,
        postedAt: "2025-07-10T09:30:00Z",
    },
];

const Projects = () => {
    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {randomProjects.map((project: any, i) => (
                <ProjectCard key={i} project={project} />
            ))}
        </div>
    );
};

export default Projects;
