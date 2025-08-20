"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { editProject } from "@/actions/content/project/editProject";
import { useRouter } from "next/navigation";

import Modal from "@/components/general/Modal";
import Step6 from "../create/Step6";
import Loader from "@/components/general/Loader";

type Props = {
    open: boolean;
    onClose: () => void;
    projectId: string;
    initialResources: string[];
};

const MAX_RESOURCES = 20;

const EditResourcesModal = ({
    open,
    onClose,
    projectId,
    initialResources,
}: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const [projectResources, setProjectResources] =
        useState<string[]>(initialResources);
    const [resourceInput, setResourceInput] = useState("");
    const [showResourceInput, setShowResourceInput] = useState(false);

    const handleAddLink = () => {
        const trimmed = resourceInput.trim();
        if (trimmed && projectResources.length < MAX_RESOURCES) {
            setProjectResources([...projectResources, trimmed]);
            setResourceInput("");
            setShowResourceInput(false);
        }
    };

    const handleRemoveLink = (index: number) => {
        setProjectResources(projectResources.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsPending(true);

        const { error } = await editProject(projectId, {
            projectResources: projectResources,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success("Project resources updated successfully.");
            router.refresh();
            onClose();
        }

        setIsPending(false);
    };

    const handleClose = () => {
        setProjectResources(initialResources);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh] w-[95vw] md:w-[80vw] lg:w-[50vw] bg-gray-100 rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b">
                    <h2 className="text-xl font-bold">
                        Edit Project Resources
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                    <Step6
                        projectResources={projectResources}
                        resourceInput={resourceInput}
                        showResourceInput={showResourceInput}
                        onLinkInputChange={setResourceInput}
                        onAddLink={handleAddLink}
                        onRemoveLink={handleRemoveLink}
                        onToggleInput={() =>
                            setShowResourceInput((prev) => !prev)
                        }
                    />
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

export default EditResourcesModal;
