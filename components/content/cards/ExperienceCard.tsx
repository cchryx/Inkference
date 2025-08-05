"use client";

import { Briefcase, CalendarDays, MapPin } from "lucide-react";

type Experience = {
    title: string;
    description?: string | null;
    organization: {
        name: string;
        image?: string | null;
    } | null;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    locationType?: string | null;
    employmentType?: string | null;
    status: "IN_PROGRESS" | "COMPLETE";
};

// Helper to calculate months between two dates, inclusive
function monthsBetween(start: Date, end: Date) {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return years * 12 + months + 1;
}

export default function ExperienceCard({
    experience,
}: {
    experience: Experience;
}) {
    const {
        title,
        description,
        organization,
        startDate,
        endDate,
        location,
        locationType,
        employmentType,
        status,
    } = experience;

    const formattedStart = new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    const formattedEnd =
        status === "IN_PROGRESS" || !endDate
            ? "Present"
            : new Date(endDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
              });

    const start = new Date(startDate);
    const end =
        endDate && status === "COMPLETE" ? new Date(endDate) : new Date();

    const durationMonths =
        status === "COMPLETE" ? monthsBetween(start, end) : null;

    const statusLabel = status === "IN_PROGRESS" ? "In Progress" : "Complete";

    const statusColor =
        status === "IN_PROGRESS"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800";

    const fillerImage = "/assets/general/fillerImage.png";

    return (
        <div className="h-[300px] bg-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.01] duration-300 overflow-hidden flex flex-col p-4">
            {/* Top section with flex: text left, image right */}
            <div className="flex justify-between items-start">
                <div className="max-w-[70%]">
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                        {title}
                    </h2>

                    {/* Organization name */}
                    {organization && (
                        <p className="mt-1 text-sm text-gray-600 font-medium">
                            {organization.name}
                        </p>
                    )}
                </div>

                {organization && (
                    <img
                        src={organization.image || fillerImage}
                        alt={organization.name}
                        className="size-18 rounded object-cover border-2 border-gray-300 shadow-md"
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== fillerImage) {
                                target.src = fillerImage;
                            }
                        }}
                    />
                )}
            </div>

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-6 overflow-hidden">
                    {description}
                </p>
            )}

            {/* Status */}
            <span
                className={`mt-4 w-fit inline-block text-xs font-medium px-2 py-1 rounded ${statusColor}`}
            >
                {statusLabel}
            </span>

            {/* Meta */}
            <div className="mt-auto text-xs text-gray-500 flex flex-col gap-1">
                <p>
                    <CalendarDays className="inline w-4 h-4 mr-1" />
                    {formattedStart} – {formattedEnd}
                    {durationMonths ? ` (${durationMonths} months)` : ""}
                </p>
                {location && locationType && (
                    <p>
                        <MapPin className="inline w-4 h-4 mr-1" />
                        {location} ({locationType})
                    </p>
                )}
                {employmentType && (
                    <p>
                        <Briefcase className="inline w-4 h-4 mr-1" />
                        {employmentType}
                    </p>
                )}
            </div>
        </div>
    );
}
