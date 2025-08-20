"use client";

import React, { useState, useMemo } from "react";
import { X, Trash2, UserPlus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Modal from "@/components/general/Modal";
import Loader from "@/components/general/Loader";
import { Label } from "@radix-ui/react-label";
import InfoTooltip from "@/components/general/InfoToolTip";
import { useSearchUsers } from "@/hooks/useUserSearch";
import { editProject } from "@/actions/content/project/editProject";
import FallbackUserIcon from "@/components/general/FallbackUserIcon";
import { UserIcon } from "@/components/general/UserIcon";

type Props = {
    open: boolean;
    onClose: () => void;
    projectId: string;
    ownerId: string;
    initialContributors: any[];
};

const EditContributorsModal = ({
    open,
    onClose,
    projectId,
    ownerId,
    initialContributors,
}: Props) => {
    const router = useRouter();
    const [contributors, setContributors] =
        useState<any[]>(initialContributors);
    const [showInput, setShowInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, setIsPending] = useState(false);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSearchUsers(searchQuery);

    const handleAddContributor = (user: any) => {
        if (contributors.find((c) => c.id === user.id)) {
            toast.error("User already added.");
            return;
        }
        setContributors((prev) => [
            {
                id: user.id,
                name: user.name,
                username: user.username,
                image: user.image,
            },
            ...prev,
        ]);
        setSearchQuery("");
        setShowInput(false);
    };

    const handleRemove = (id: string) => {
        setContributors((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSave = async () => {
        setIsPending(true);

        const contributorUserIds = contributors.map((c) => c.id);

        const { error } = await editProject(projectId, {
            contributors: contributorUserIds,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success("Contributors updated successfully.");
            router.refresh();
            onClose();
        }

        setIsPending(false);
    };

    const filteredUsers = useMemo(() => {
        const allUsers = data?.pages.flatMap((page) => page.users) || [];

        return allUsers.filter(
            (user) =>
                user.id !== ownerId &&
                !contributors.find((c) => (c.user ?? c).id === user.id)
        );
    }, [data, contributors, ownerId]);

    const handleClose = () => {
        setContributors(initialContributors);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw] bg-gray-100 rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">Edit Contributors</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    {/* Add contributor button */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {contributors.length} contributor
                            {contributors.length !== 1 && "s"}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowInput((prev) => !prev)}
                            className="w-fit text-xs px-2 py-1 h-auto mt-1 cursor-pointer"
                        >
                            {showInput ? "Cancel" : "+ Add Contributors"}
                        </Button>
                    </div>

                    {/* Search input */}
                    {showInput && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label htmlFor="description">
                                    Contributors
                                </Label>
                                <InfoTooltip text="Search a select users to add to your project contributors. Already added users will not show up here." />
                            </div>
                            <Input
                                placeholder="Search users by name or username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                            {/* Only show dropdown if searchQuery is not empty */}
                            {searchQuery.trim() !== "" && (
                                <div
                                    className="bg-white border rounded-md shadow-sm max-h-48 overflow-y-auto"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        if (
                                            target.scrollTop +
                                                target.clientHeight >=
                                                target.scrollHeight - 10 &&
                                            hasNextPage &&
                                            !isFetchingNextPage
                                        ) {
                                            fetchNextPage();
                                        }
                                    }}
                                >
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user: any) => (
                                            <div
                                                key={user.id}
                                                onClick={() =>
                                                    handleAddContributor(user)
                                                }
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                <UserIcon
                                                    size="size-8"
                                                    image={user.image}
                                                />
                                                <div className="flex flex-col min-w-0 flex-grow">
                                                    <p className="font-medium truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            No users found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contributors list */}
                    <div className="space-y-2">
                        {contributors.length === 0 ? (
                            <div className="text-sm text-gray-500 border rounded-xl p-4">
                                No contributors yet. Click{" "}
                                <b>Add Contributor</b> to get started.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {contributors.map((contributor) => (
                                    <li
                                        key={contributor.id}
                                        className="flex items-center justify-between gap-3 border rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {contributor.image ? (
                                                <img
                                                    src={contributor.image}
                                                    alt={contributor.name}
                                                    className="w-9 h-9 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <FallbackUserIcon size="size-9" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {contributor.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    @{contributor.username}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemove(contributor.id)
                                            }
                                            className="p-2 text-gray-600 hover:text-red-600 rounded-lg cursor-pointer"
                                            aria-label="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center px-5 py-4 border-t bg-gray-100 rounded-b-xl gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="cursor-pointer"
                        disabled={isPending}
                    >
                        {isPending && <Loader size={5} color="text-white" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditContributorsModal;
