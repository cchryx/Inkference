"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PROFILE_LINKS } from "@/constants";
import { getPreferences, setPreferences } from "@/actions/preferences";
import { PROFILE_SECTIONS, type ProfileSection } from "@/lib/profileSections";
import { Skeleton } from "@/components/general/Skeleton";

/** Settings > Profile: pick which tabs show on your profile and Build page. */
export default function ProfileSectionsForm() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["preferences"], queryFn: () => getPreferences() });
    const hidden = data?.hiddenSections ?? [];

    const toggle = async (id: ProfileSection) => {
        const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
        if (next.length >= PROFILE_SECTIONS.length) return toast.error("Keep at least one tab.");
        queryClient.setQueryData(["preferences"], { ...data, hiddenSections: next });
        const { error } = await setPreferences({ hiddenSections: next });
        if (error) {
            toast.error(error);
            queryClient.invalidateQueries({ queryKey: ["preferences"] });
        }
    };

    return (
        <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md lg:col-span-2">
            <div>
                <h1 className="text-base font-semibold">Profile tabs</h1>
                <p className="text-xs text-muted-foreground">
                    Choose which tabs show on your profile and Build page. Hiding one doesn&apos;t delete anything.
                </p>
            </div>
            {isLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {PROFILE_LINKS.map(({ id, label, icon: Icon }) => {
                        const on = !hidden.includes(id as ProfileSection);
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggle(id as ProfileSection)}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                                    on
                                        ? "bg-black text-white hover:bg-gray-800"
                                        : "bg-white text-gray-500 ring-1 ring-gray-300 hover:text-black"
                                }`}
                            >
                                <Icon className="size-3.5" />
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
