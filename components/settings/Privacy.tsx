"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Eye, Globe, Lock, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { UserIcon } from "@/components/general/UserIcon";
import UserPicker, { type PickedUser } from "@/components/general/UserPicker";
import {
    getPrivacySettings,
    updateDefaultVisibility,
    updateHiddenFrom,
} from "@/actions/privacy/privacy";
import { unblockUser } from "@/actions/users/blockUser";
import type { Audience } from "@/lib/visibility";

export const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string; icon: typeof Globe }[] = [
    { value: "PUBLIC", label: "Everyone", hint: "Anyone on Inkference", icon: Globe },
    { value: "FOLLOWERS", label: "Followers", hint: "People who follow you, and friends", icon: Users },
    { value: "FRIENDS", label: "Friends", hint: "Only your friends", icon: UserCheck },
    { value: "PRIVATE", label: "Only me", hint: "Nobody else", icon: Lock },
];

const Card = ({ title, text, children }: { title: string; text: string; children: React.ReactNode }) => (
    <div className="w-full space-y-3 rounded-md border border-gray-200 p-4">
        <div className="space-y-1">
            <h1 className="text-base font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
        {children}
    </div>
);

const Privacy = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["privacy"], queryFn: () => getPrivacySettings() });

    const [savingDefault, setSavingDefault] = useState<Audience | null>(null);
    const [hidden, setHidden] = useState<PickedUser[] | null>(null);
    const [savingHidden, setSavingHidden] = useState(false);
    const [unblocking, setUnblocking] = useState<string | null>(null);

    if (isLoading || !data) {
        return (
            <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-md" />
                ))}
            </div>
        );
    }

    const hiddenList = hidden ?? data.hiddenFrom;
    const hiddenChanged =
        hidden !== null &&
        (hidden.length !== data.hiddenFrom.length || hidden.some((u) => !data.hiddenFrom.find((x) => x.id === u.id)));

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["privacy"] });

    const chooseDefault = async (level: Audience) => {
        setSavingDefault(level);
        const { error } = await updateDefaultVisibility(level);
        setSavingDefault(null);
        if (error) return toast.error(error);
        toast.success("Default audience updated.");
        refresh();
    };

    const saveHidden = async () => {
        setSavingHidden(true);
        const { error } = await updateHiddenFrom(hiddenList.map((u) => u.id));
        setSavingHidden(false);
        if (error) return toast.error(error);
        toast.success("Saved.");
        setHidden(null);
        refresh();
    };

    const unblock = async (id: string, username: string | null) => {
        setUnblocking(id);
        const { error } = await unblockUser(id);
        setUnblocking(null);
        if (error) return toast.error(error);
        toast.success(`Unblocked @${username}.`);
        refresh();
    };

    return (
        <div className="space-y-3">
            {/* Default audience */}
            <Card
                title="Who can see your posts, projects and galleries"
                text="This is the default. You can still change it for any single post, project or gallery."
            >
                <div className="grid gap-2 sm:grid-cols-2">
                    {AUDIENCE_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
                        const active = data.defaultVisibility === value;
                        return (
                            <button
                                key={value}
                                onClick={() => !active && chooseDefault(value)}
                                disabled={!!savingDefault}
                                className={`flex items-center gap-3 rounded-md border-2 p-3 text-left transition cursor-pointer ${
                                    active ? "border-neutral-900 bg-white" : "border-gray-200 hover:border-gray-400"
                                }`}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold">{label}</span>
                                    <span className="block text-xs text-gray-500">{hint}</span>
                                </span>
                                {savingDefault === value ? (
                                    <Loader size={4} color="text-gray-500" />
                                ) : (
                                    <span
                                        className={`h-4 w-4 rounded-full border-2 ${
                                            active ? "border-neutral-900 bg-neutral-900" : "border-gray-300"
                                        }`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Hidden from */}
            <Card
                title="Hide your content from specific people"
                text="These people can't see any of your posts, projects or galleries, whatever the audience. They can still see your profile. They aren't told."
            >
                <UserPicker
                    value={hiddenList}
                    onChange={setHidden}
                    disabled={savingHidden}
                    placeholder="Search people to hide from…"
                />
                {hiddenChanged && (
                    <div className="flex gap-2">
                        <Button onClick={saveHidden} disabled={savingHidden} className="cursor-pointer">
                            {savingHidden && <Loader size={4} />}
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => setHidden(null)} disabled={savingHidden} className="cursor-pointer">
                            Cancel
                        </Button>
                    </div>
                )}
            </Card>

            {/* Blocked */}
            <Card
                title="Blocked accounts"
                text="Blocked people can't see your profile or content, follow you or send you friend requests. Block someone from the ⋯ button on their profile."
            >
                {data.blocked.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                        <Eye className="h-4 w-4" /> You haven&apos;t blocked anyone.
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {data.blocked.map((u) => (
                            <li key={u.id} className="flex items-center gap-3 p-3">
                                <UserIcon image={u.image} size="size-9" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{u.name}</p>
                                    <p className="truncate text-xs text-gray-500">@{u.username}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unblock(u.id, u.username)}
                                    disabled={unblocking === u.id}
                                    className="cursor-pointer"
                                >
                                    {unblocking === u.id ? <Loader size={4} color="text-gray-500" /> : <Ban className="h-4 w-4" />}
                                    Unblock
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default Privacy;
