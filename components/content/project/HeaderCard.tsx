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
    Eye,
    Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ConfirmModal from "../../general/ConfirmModal";
import { deleteProject } from "@/actions/content/project/deleteProject";
import { useRouter } from "next/navigation";
import EditHeaderModal from "./edit/EditHeaderModal";
import { likeProject } from "@/actions/content/project/likeProject";
import { viewProject } from "@/actions/content/project/viewProject";
import { saveProject } from "@/actions/content/project/saveProject";
import { createPost } from "@/actions/content/post/createPost";

type Props = {
    isOwner: boolean;
    session: any;
    project: any;
};

export const HeaderCard = ({ isOwner, session, project }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);
    const [confirmPostOpen, setConfirmPostOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [likes, setLikes] = useState(project.likes || []);
    const [saves, setSaves] = useState(project.saves || []);

    const currentUserId = session?.user.id;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);

        if (currentUserId) {
            viewProject(project.id, currentUserId);
        }

        return () => clearTimeout(timer);
    }, []);

    const handleLike = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to like projects.");
            return;
        }

        const isLiked = likes.some((u: any) => u.userId === currentUserId);

        const updatedLikes = isLiked
            ? likes.filter((u: any) => u.userId !== currentUserId)
            : [...likes, { userId: currentUserId }];

        setLikes(updatedLikes);

        const { error } = await likeProject(project.id, currentUserId);
        if (error) {
            toast.error(error);
            setLikes(likes);
        }
    };

    const handleSave = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to save projects.");
            return;
        }

        const isSaved = saves.some((u: any) => u.userId === currentUserId);

        const updatedSaves = isSaved
            ? saves.filter((u: any) => u.userId !== currentUserId)
            : [...saves, { userId: currentUserId }];

        setSaves(updatedSaves);

        const { error } = await saveProject(project.id, currentUserId);
        if (error) {
            toast.error(error);
            setSaves(saves);
        }
    };

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

    const handlePostProject = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to post projects.");
            return;
        }

        setIsPending(true);

        const { error } = await createPost({
            type: "project",
            dataId: project.id,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success("Project posted successfully.");
        }

        setIsPending(false);
    };

    const startDate = project.startDate
        ? new Date(project.startDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "";
    const endDate = project.endDate
        ? new Date(project.endDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "Present";
    const postedAt = project.createdAt
        ? new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "";

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

            <ConfirmModal
                isPending={isPending}
                open={confirmPostOpen}
                title="Post this project?"
                text="This project will be shared as a post."
                confirmText="Post"
                cancelText="Cancel"
                confirmVariant="default"
                onConfirm={() => {
                    handlePostProject();
                    setConfirmPostOpen(false);
                }}
                onClose={() => setConfirmPostOpen(false)}
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
            <div className="rounded-md bg-gray-200 overflow-hidden shadow-md w-full h-full">
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

                    <div className="absolute left-[3%] -bottom-[10%] w-20 h-20 md:w-40 md:h-40 rounded-md border-[3px] flex items-center justify-center overflow-hidden">
                        <img
                            src={
                                project.iconImage ??
                                "/assets/general/fillers/project.png"
                            }
                            alt={`${project.name} icon`}
                            className="w-full h-full object-cover bg-gray-800/50"
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
                                    Posted on {postedAt}
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
                                            onClick={() =>
                                                setConfirmPostOpen(true)
                                            }
                                            className="flex items-center w-fit gap-2 px-3 py-1 rounded-sm bg-gray-300 hover:bg-gray-400 transition text-sm cursor-pointer"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
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
                                <button
                                    className="px-3 py-1 rounded-sm flex gap-2 items-center transition text-sm bg-gray-300 cursor-default"
                                    disabled
                                >
                                    <Eye className="w-4 h-4 text-gray-600" />
                                    <span>{project.views?.length ?? 0}</span>
                                </button>
                                <button
                                    onClick={handleLike}
                                    className={`px-3 py-1 rounded-sm flex gap-2 items-center transition text-sm cursor-pointer ${
                                        likes.some(
                                            (u: any) =>
                                                u.userId === currentUserId
                                        )
                                            ? "bg-red-400 text-white"
                                            : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${
                                            likes.some(
                                                (u: any) =>
                                                    u.userId === currentUserId
                                            )
                                                ? "fill-white"
                                                : ""
                                        }`}
                                    />
                                    <span>{likes.length}</span>
                                </button>

                                <button
                                    onClick={handleSave}
                                    className={`px-3 py-1 rounded-sm flex gap-2 items-center transition text-sm cursor-pointer ${
                                        saves.some(
                                            (u: any) =>
                                                u.userId === currentUserId
                                        )
                                            ? "bg-yellow-500 text-white"
                                            : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                                >
                                    <Bookmark
                                        className={`w-4 h-4 ${
                                            saves.some(
                                                (u: any) =>
                                                    u.userId === currentUserId
                                            )
                                                ? "fill-white"
                                                : ""
                                        }`}
                                    />
                                    <span>{saves.length}</span>
                                </button>
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
