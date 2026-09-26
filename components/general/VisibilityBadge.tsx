"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe, Lock, UserCheck, UserRoundCog, Users } from "lucide-react";
import { getContentVisibility } from "@/actions/privacy/privacy";

type Props = {
    kind: "post" | "project" | "gallery";
    id: string;
    /** Opens "Who can see this". */
    onClick?: () => void;
    className?: string;
};

const LEVELS = {
    PUBLIC: { label: "Everyone", icon: Globe },
    FOLLOWERS: { label: "Followers", icon: Users },
    FRIENDS: { label: "Friends", icon: UserCheck },
    CUSTOM: { label: "Specific people", icon: UserRoundCog },
    PRIVATE: { label: "Only me", icon: Lock },
} as const;

/**
 * Tiny "Visible to: Friends" tag for the owner of a post, project or
 * gallery. Shows nothing to anyone else.
 */
export default function VisibilityBadge({ kind, id, onClick, className = "" }: Props) {
    const { data } = useQuery({
        queryKey: ["visibility", kind, id],
        queryFn: () => getContentVisibility(kind, id),
        staleTime: 60_000,
    });
    if (!data) return null;

    const level = data.visibility === "DEFAULT" ? data.defaultVisibility : data.visibility;
    const { label, icon: Icon } = LEVELS[level as keyof typeof LEVELS] ?? LEVELS.PUBLIC;
    const text =
        level === "CUSTOM" ? `${data.allowed.length} ${data.allowed.length === 1 ? "person" : "people"}` : label;
    const hidden = data.hidden.length ? ` · hidden from ${data.hidden.length}` : "";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            title="Who can see this"
            className={`inline-flex w-fit items-center gap-1 text-[11px] leading-none text-gray-500 enabled:hover:text-black enabled:cursor-pointer ${className}`}
        >
            <Icon className="size-3" />
            <span>
                Visible to {text}
                {hidden}
            </span>
        </button>
    );
}
