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

type User = {
    id: string;
    name: string;
    username: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    projectId: string;
    initialContributors: User[];
};

// Dummy data for simulation
const dummyUsers: User[] = [
    { id: "1", name: "Alice Zhang", username: "alicez" },
    { id: "2", name: "Bob Lee", username: "boblee" },
    { id: "3", name: "Chris Park", username: "chrispark" },
    { id: "4", name: "Dana Wu", username: "danawu" },
];

const EditContributorsModal = ({
    open,
    onClose,
    projectId,
    initialContributors,
}: Props) => {
    const router = useRouter();
    const [contributors, setContributors] =
        useState<User[]>(initialContributors);
    const [showInput, setShowInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleAddContributor = (user: User) => {
        if (contributors.find((c) => c.id === user.id)) {
            toast.error("User already added.");
            return;
        }
        setContributors((prev) => [user, ...prev]);
        setSearchQuery("");
        setShowInput(false);
    };

    const handleRemove = (id: string) => {
        setContributors((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSave = async () => {
        setIsPending(true);
        toast.success("Contributors updated successfully.");
        router.refresh();
        onClose();
        setIsPending(false);
    };

    const filteredUsers = useMemo(() => {
        return dummyUsers.filter(
            (u) =>
                (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.username
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())) &&
                !contributors.find((c) => c.id === u.id)
        );
    }, [searchQuery, contributors]);

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh]">
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
                                <div className="bg-white border rounded-md shadow-sm max-h-48 overflow-y-auto">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() =>
                                                    handleAddContributor(user)
                                                }
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                <p className="font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    @{user.username}
                                                </p>
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
                                            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                                <UserCircle className="w-5 h-5 text-gray-500" />
                                            </div>
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
                        onClick={onClose}
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
