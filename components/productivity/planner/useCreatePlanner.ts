"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDriveFile } from "@/actions/drive/drive";

/** Makes a new planner (one "To do" list) and opens it. */
export function useCreatePlanner() {
    const router = useRouter();
    const [creating, setCreating] = useState(false);

    const create = async () => {
        if (creating) return;
        setCreating(true);
        const { error, id } = await createDriveFile("planner");
        if (error || !id) {
            setCreating(false);
            toast.error(error ?? "Couldn't create the planner.");
            return;
        }
        router.push(`/productivity/planners/${id}`);
    };

    return { create, creating };
}
