"use client";

import { deleteEducation } from "@/actions/content/education/deleteEducation";
import ConfirmModal from "@/components/general/ConfirmModal";
import { CalendarDays, GraduationCap, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Education = {
    id: string;
    school: string | null;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string | null;
    activitiesAndSocieties?: string | null;
};

function monthsBetween(start: Date, end: Date) {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return years * 12 + months + 1;
}

const EducationCard = ({
    education,
    rootUser = false,
    onDelete,
}: {
    education: Education;
    rootUser?: boolean;
    onDelete?: (id: string) => Promise<{ error?: string }>;
}) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);

    const {
        id,
        school,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        activitiesAndSocieties,
    } = education;

    const formattedStart = new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    const formattedEnd = endDate
        ? new Date(endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
          })
        : "Present";

    const durationMonths = monthsBetween(
        new Date(startDate),
        endDate ? new Date(endDate) : new Date()
    );

    const fillerImage = "/assets/general/fillers/education.png";

    const handleDeleteEducation = async () => {
        setIsPending(true);
        const { error } = await deleteEducation(education.id);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Education deleted successfully.");
            router.refresh();
        }
        setIsPending(false);
    };

    return (
        <>
            <ConfirmModal
                isPending={isPending}
                open={confirmMopen}
                title="Delete this education entry?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteEducation();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />

            <div className="relative cursor-pointer h-[300px] bg-gray-100 rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.01] duration-300 overflow-hidden flex flex-col p-4">
                {/* Top: text + school image */}
                <div className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
                            {school}
                        </h2>
                        <p className="text-sm text-gray-700 mt-0.5">
                            {fieldOfStudy || ""}
                        </p>
                    </div>

                    <img
                        src={school || fillerImage}
                        className="size-20 rounded object-contain border-2 border-gray-300 shadow-sm"
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== fillerImage) {
                                target.src = fillerImage;
                            }
                        }}
                    />
                </div>

                {/* Activities */}
                {activitiesAndSocieties && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-5 overflow-hidden">
                        <span className="font-medium text-gray-700 block mb-1">
                            Activities & Societies:
                        </span>
                        {activitiesAndSocieties}
                    </p>
                )}

                {/* Meta */}
                <div className="mt-auto text-xs text-gray-500 flex flex-col gap-1 pr-6">
                    <p>
                        <CalendarDays className="inline w-4 h-4 mr-1" />
                        {formattedStart} – {formattedEnd} ({durationMonths}{" "}
                        months)
                    </p>
                    <p>
                        <GraduationCap className="inline w-4 h-4 mr-1" />
                        {degree}
                    </p>
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

export default EducationCard;
