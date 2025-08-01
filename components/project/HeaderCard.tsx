"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/general/Skeleton";
import {
    User,
    Share2,
    Link2,
    CalendarDays,
    Heart,
    Bookmark,
    Pencil,
    Pen,
    Trash,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ConfirmModal from "../general/ConfirmModal";
import { deleteProject } from "@/actions/content/project/deleteProject";
import { useRouter } from "next/navigation";
import EditHeaderModal from "./edit/EditHeaderModal";

type Props = {
    isOwner: boolean;
    project: any;
};

export const HeaderCard = ({ isOwner, project }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleShare = () => {
        const projectUrl = `${window.location.origin}/project/${project.id}`;
        navigator.clipboard.writeText(projectUrl);
        toast.success("Project link copied.");
    };

    const handleDeleteProject = async () => {
        setIsPending(true);
        const { error } = await deleteProject(project.id);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Project deleted successfully.");
            router.refresh();
            router.push("/library");
        }

        setIsPending(false);
    };

    const startDate = format(new Date(project.startDate), "dd MMM, yyyy");
    const endDate = project.endDate
        ? format(new Date(project.endDate), "dd MMM, yyyy")
        : "TBD";
    const postedAt = new Date(
        project.createdAt || project.updatedAt || Date.now()
    );

    if (isLoading) {
        return (
            <div className="rounded-md overflow-hidden shadow-md w-full h-full">
                {/* Banner + Icon */}
                <div className="relative">
                    <Skeleton className="w-full h-[200px] md:h-[350px]" />
                    <div className="absolute left-[3%] -bottom-[10%] w-20 h-20 md:w-40 md:h-40 rounded-md border-[3px] border-gray-200 overflow-hidden">
                        <Skeleton className="w-full h-full" />
                    </div>
                </div>

                {/* Body */}
                <div className="bg-gray-200 p-4 pt-14 md:pt-16">
                    {/* Top row: title / dates / status  +  actions on right */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            {/* Title */}
                            <Skeleton className="h-8 w-3/4 rounded-md" />

                            {/* Dates row */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-4 w-44 rounded-md" />
                                </div>
                                <Skeleton className="h-4 w-40 rounded-md" />
                            </div>

                            {/* Status chip */}
                            <Skeleton className="h-7 w-24 rounded-full" />
                        </div>

                        {/* Actions (Share / Likes / Bookmarks) */}
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            <Skeleton className="h-9 w-36 rounded-md" />
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-24 rounded-md" />
                                <Skeleton className="h-9 w-24 rounded-md" />
                            </div>
                        </div>
                    </div>

                    {/* Description paragraphs */}
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-[95%] rounded-md" />
                        <Skeleton className="h-4 w-[92%] rounded-md" />
                        <Skeleton className="h-4 w-[88%] rounded-md" />
                        <Skeleton className="h-4 w-[90%] rounded-md" />
                        <Skeleton className="h-4 w-[70%] rounded-md" />
                    </div>

                    {/* Links */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-5 w-64 rounded-md" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-5 w-80 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ConfirmModal
                isPending={isPending}
                open={confirmMopen}
                title="Delete this project?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteProject();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />
            <EditHeaderModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                projectId={project.id}
                initialName={project.name}
                initialSummary={project.summary}
                initialDescription={project.description}
                initialLinks={project.projectLinks || []}
                initialIconImage={project.iconImage || ""}
                initialBannerImage={project.bannerImage || ""}
                initialTimeline={{
                    status:
                        project.status === "COMPLETE"
                            ? "Complete"
                            : "In Progress",
                    startDate: project.startDate / 1000 || null,
                    endDate: project.endDate / 1000 || null,
                }}
            />
            <div className="rounded-md overflow-hidden shadow-md w-full h-full">
                <div className="relative">
                    <div
                        className="w-full h-[200px] md:h-[350px] bg-center bg-cover"
                        style={{
                            backgroundImage: `url('${
                                project.bannerImage ??
                                "/assets/general/fillerImage.png"
                            }')`,
                        }}
                    />

                    <div className="absolute left-[3%] -bottom-[10%] w-20 h-20 md:w-40 md:h-40 rounded-md border-[3px] border-gray-200 flex items-center justify-center bg-gray-700 overflow-hidden">
                        <img
                            src={
                                project.iconImage ??
                                "/assets/general/folder.png"
                            }
                            alt={`${project.name} icon`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="bg-gray-200 p-4 font-medium pt-10 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex flex-col space-y-2">
                            <div className="text-[25px] font-bold mt-4">
                                {project.name}
                            </div>

                            <div className="text-sm text-gray-600 flex flex-wrap gap-2 md:gap-4 items-center">
                                <div className="flex items-center gap-1">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>
                                        {startDate} – {endDate}
                                    </span>
                                </div>
                                <span className="text-gray-500">
                                    Posted on {format(postedAt, "dd MMM, yyyy")}
                                </span>
                            </div>

                            <div
                                className={`px-2 py-1 w-fit rounded-md text-sm ${
                                    project.status === "COMPLETE" ||
                                    project.status === "Completed"
                                        ? "bg-green-200 text-green-800"
                                        : project.status === "IN_PROGRESS" ||
                                          project.status === "In Progress"
                                        ? "bg-yellow-200 text-yellow-800"
                                        : "bg-gray-200 text-gray-700"
                                }`}
                            >
                                {project.status === "COMPLETE" ||
                                project.status === "Completed"
                                    ? "Completed"
                                    : project.status === "IN_PROGRESS" ||
                                      project.status === "In Progress"
                                    ? "In Progress"
                                    : project.status}
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col flex-wrap gap-2 items-start md:items-end w-full">
                            <div className="flex w-full flex-wrap gap-2 justify-start md:justify-end">
                                <button
                                    onClick={handleShare}
                                    className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Project
                                </button>
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={() => setEditOpen(true)}
                                            className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setConfirmMOpen(true)
                                            }
                                            className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex w-full flex-wrap gap-2 justify-start md:justify-end">
                                <div className="px-3 py-1 rounded-sm bg-gray-300 flex gap-2 items-center hover:bg-gray-400 transition text-sm cursor-pointer">
                                    <Heart /> <span>100,020</span>
                                </div>
                                <div className="px-3 py-1 rounded-sm bg-gray-300 flex gap-2 items-center hover:bg-gray-400 transition text-sm cursor-pointer">
                                    <Bookmark /> <span>100,020</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="whitespace-pre-line lg:text-md text-sm">
                        {project.description}
                    </div>

                    {/* Links Section */}
                    <div className="mt-4 text-sm flex flex-col">
                        {project.projectLinks?.length > 0 &&
                            project.projectLinks.map(
                                (link: string, idx: number) => (
                                    <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-2 py-1 rounded-sm cursor-pointer w-full"
                                    >
                                        <Link2 className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate overflow-hidden whitespace-nowrap w-full text-gray-800">
                                            {link}
                                        </span>
                                    </a>
                                )
                            )}
                    </div>
                </div>
            </div>
        </>
    );
};
