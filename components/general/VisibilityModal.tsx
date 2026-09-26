"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Globe, Lock, Settings2, UserCheck, UserRoundCog, Users, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import Loader from "./Loader";
import UserPicker, { type PickedUser } from "./UserPicker";
import { Button } from "@/components/ui/button";
import { getContentVisibility, updateContentVisibility } from "@/actions/privacy/privacy";
import type { Visibility } from "@/lib/visibility";

type Kind = "post" | "project" | "gallery";

type Props = {
    kind: Kind;
    id: string;
    onClose: () => void;
};

const DEFAULT_LABEL: Record<string, string> = {
    PUBLIC: "Everyone",
    FOLLOWERS: "Followers",
    FRIENDS: "Friends",
    PRIVATE: "Only me",
};

const OPTIONS: { value: Visibility; label: string; hint: string; icon: typeof Globe }[] = [
    { value: "DEFAULT", label: "Default", hint: "", icon: Settings2 },
    { value: "PUBLIC", label: "Everyone", hint: "Anyone on Inkference", icon: Globe },
    { value: "FOLLOWERS", label: "Followers", hint: "People who follow you, and friends", icon: Users },
    { value: "FRIENDS", label: "Friends", hint: "Only your friends", icon: UserCheck },
    { value: "CUSTOM", label: "Specific people", hint: "Only the people you pick", icon: UserRoundCog },
    { value: "PRIVATE", label: "Only me", hint: "Nobody else", icon: Lock },
];

/**
 * "Who can see this?" for one post, project or gallery. Overrides the
 * default audience from Settings.
 */
const VisibilityModal = ({ kind, id, onClose }: Props) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["visibility", kind, id],
        queryFn: () => getContentVisibility(kind, id),
        staleTime: 0,
    });

    // Local edits (null = not changed yet, use what was loaded).
    const [visibility, setVisibility] = useState<Visibility | null>(null);
    const [allowed, setAllowed] = useState<PickedUser[] | null>(null);
    const [hidden, setHidden] = useState<PickedUser[] | null>(null);
    const [saving, setSaving] = useState(false);

    const current = visibility ?? data?.visibility ?? "DEFAULT";
    const allowedList = allowed ?? data?.allowed ?? [];
    const hiddenList = hidden ?? data?.hidden ?? [];

    const save = async () => {
        setSaving(true);
        const { error } = await updateContentVisibility(kind, id, {
            visibility: current,
            allowedUserIds: allowedList.map((u) => u.id),
            hiddenFromUserIds: hiddenList.map((u) => u.id),
        });
        setSaving(false);
        if (error) return toast.error(error);
        toast.success("Visibility updated.");
        void queryClient.invalidateQueries({ queryKey: ["visibility", kind, id] });
        router.refresh();
        onClose();
    };

    return (
        <Modal open onClose={saving ? () => {} : onClose}>
            <div className="flex max-h-[90vh] w-[95vw] flex-col rounded-xl bg-gray-100 shadow-xl md:w-[520px]">
                <div className="flex items-start justify-between border-b p-5">
                    <div>
                        <h2 className="text-xl font-bold">Who can see this {kind}?</h2>
                        <p className="text-sm text-gray-500">This overrides your default in Settings → Privacy.</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="text-gray-600 hover:text-black cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Loader size={6} color="text-gray-500" />
                        </div>
                    )}
                    {(isError || (!isLoading && !data)) && (
                        <p className="text-sm text-red-600">Couldn&apos;t load this {kind}&apos;s settings.</p>
                    )}

                    {data && (
                        <>
                            <div className="space-y-2">
                                {OPTIONS.map(({ value, label, hint, icon: Icon }) => {
                                    const active = current === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setVisibility(value)}
                                            className={`flex w-full items-center gap-3 rounded-md border-2 p-3 text-left transition cursor-pointer ${
                                                active ? "border-neutral-900 bg-white" : "border-gray-200 hover:border-gray-400"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold">{label}</span>
                                                <span className="block text-xs text-gray-500">
                                                    {value === "DEFAULT"
                                                        ? `Use your default (${DEFAULT_LABEL[data.defaultVisibility]})`
                                                        : hint}
                                                </span>
                                            </span>
                                            <span
                                                className={`h-4 w-4 rounded-full border-2 ${
                                                    active ? "border-neutral-900 bg-neutral-900" : "border-gray-300"
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {current === "CUSTOM" && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">People who can see it</p>
                                    <UserPicker
                                        value={allowedList}
                                        onChange={setAllowed}
                                        disabled={saving}
                                        placeholder="Add people…"
                                    />
                                </div>
                            )}

                            {current !== "PRIVATE" && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">Hide from</p>
                                    <p className="text-xs text-gray-500">
                                        These people won&apos;t see this {kind}, even if they&apos;d normally be allowed to.
                                    </p>
                                    <UserPicker
                                        value={hiddenList}
                                        onChange={setHidden}
                                        disabled={saving}
                                        placeholder="Search people to hide from…"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 rounded-b-xl border-t px-5 py-4">
                    <Button variant="outline" onClick={onClose} disabled={saving} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saving || !data} className="cursor-pointer">
                        {saving && <Loader size={5} color="text-white" />}
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default VisibilityModal;
