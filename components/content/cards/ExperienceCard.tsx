"use client";

import { deleteExperience } from "@/actions/content/experience/deleteExperience";
import ConfirmModal from "@/components/general/ConfirmModal";
import { Briefcase, CalendarDays, MapPin, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Experience = {
    id: string;
    title: string;
    description?: string | null;
    organization: string | null;
    status: "Ongoing" | "Complete";
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    locationType?: string | null;
    employmentType?: string | null;
};

// Helper to calculate months between two dates, inclusive
function monthsBetween(start: Date, end: Date) {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return years * 12 + months + 1;
}

const ExperienceCard = ({
    experience,
    rootUser = false,
}: {
    experience: Experience;
    rootUser?: boolean;
}) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);

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
        day: "numeric",
        year: "numeric",
    });

    const formattedEnd =
        status === "Ongoing" || !endDate
            ? "Present"
            : new Date(endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
              });

    const start = new Date(startDate);
    const end =
        endDate && status === "Complete" ? new Date(endDate) : new Date();

    const durationMonths =
        status === "Complete" ? monthsBetween(start, end) : null;

    const statusLabel = status;

    const statusColor =
        status === "Ongoing"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800";

    const fillerImage = "/assets/general/fillerImage.png";

    const handleDeleteExperience = async () => {
        setIsPending(true);
        const { error } = await deleteExperience(experience.id);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Experience deleted successfully.");
            router.refresh();
        }
        setIsPending(false);
    };

    return (
        <>
            <ConfirmModal
                isPending={isPending}
                open={confirmMopen}
                title="Delete this experience?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteExperience();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />
            <div className="relative h-[300px] bg-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.01] duration-300 overflow-hidden flex flex-col p-4">
                {/* Top section with flex: text left, image right */}
                <div className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                        {/* Title */}
                        <h2 className="text-lg font-semibold text-gray-800 line-clamp-3">
                            {title}
                        </h2>

                        {/* Organization name */}
                        {/* Organization name */}
                        {organization && (
                            <p className="mt-1 text-sm text-gray-600 font-medium">
                                {organization}
                            </p>
                        )}
                    </div>

                    {organization && (
                        <img
                            src={organization || fillerImage}
                            className="size-20 rounded object-contain border-2 border-gray-300 shadow-md rounded-md"
                            onError={(e) => {
                                const target =
                                    e.currentTarget as HTMLImageElement;
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
                <div className="mt-auto text-xs text-gray-500 flex flex-col gap-1 pr-6">
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

                {/* Delete Button */}
                {rootUser && (
                    <button
                        className="absolute bottom-3 cursor-pointer right-3 text-black hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition"
                        onClick={() => {
                            setConfirmMOpen(true);
                        }}
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                )}
            </div>
        </>
    );
};

export default ExperienceCard;
