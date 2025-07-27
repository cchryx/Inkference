import { Heart, Eye, CalendarDays } from "lucide-react";

type Project = {
    bannerUrl: string;
    name: string;
    description: string;
    status: "In Progress" | "Complete";
    startDate: string;
    endDate: string;
    skills: string[];
    likes: number;
    views: number;
    postedAt: string;
};

export default function ProjectCard({ project }: { project: Project }) {
    const formattedDate = new Date(project.postedAt).toLocaleDateString(
        "en-GB"
    );

    return (
        <div className="group relative h-[400px] bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.015] duration-300 overflow-hidden flex flex-col cursor-pointer">
            {/* Banner Image */}
            <div
                className="h-32 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{
                    backgroundImage: `url('${project.bannerUrl}')`,
                }}
            />

            {/* Card Body */}
            <div className="flex-1 bg-gray-200 p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                        {project.name}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-4">
                        {project.description}
                    </p>
                </div>

                <div className="mt-3">
                    <p className="text-xs text-gray-500">
                        Status:{" "}
                        <span
                            className={
                                project.status === "Complete"
                                    ? "text-green-600 font-medium"
                                    : "text-yellow-600 font-medium"
                            }
                        >
                            {project.status}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Duration: {project.startDate} – {project.endDate}
                    </p>
                </div>

                <div className="mt-3 overflow-hidden max-h-[3.2rem] flex flex-wrap gap-1">
                    {project.skills.map((skill, idx) => (
                        <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Hover Stats */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-sm pointer-events-none">
                {/* Top-Left Message */}
                <div className="text-xs bg-white/10 px-2 py-1 rounded-md font-medium w-fit text-white shadow-sm">
                    Click to view project in detail
                </div>

                {/* Bottom Stats */}
                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Heart className="w-4 h-4" /> {project.likes} Likes
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <Eye className="w-4 h-4" /> {project.views} Views
                    </div>
                    <div className="flex items-center gap-2 drop-shadow-sm">
                        <CalendarDays className="w-4 h-4" /> Posted:{" "}
                        {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
}
