"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { unblockUser } from "@/actions/users/blockUser";

type Props = {
    userId: string;
    username: string;
    /** true = you blocked them (can unblock). false = they blocked you. */
    blockedByMe: boolean;
};

const BlockedNotice = ({ userId, username, blockedByMe }: Props) => {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    const unblock = async () => {
        setPending(true);
        const { error } = await unblockUser(userId);
        setPending(false);
        if (error) return toast.error(error);
        toast.success(`Unblocked @${username}.`);
        router.refresh();
    };

    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-3 rounded-md bg-gray-100 p-8 text-center shadow-md">
                <Ban className="mx-auto h-10 w-10 text-gray-500" />
                {blockedByMe ? (
                    <>
                        <h1 className="text-xl font-semibold">You blocked @{username}</h1>
                        <p className="text-sm text-gray-600">
                            You can&apos;t see each other&apos;s profile, posts, projects or galleries.
                        </p>
                        <Button onClick={unblock} disabled={pending} className="cursor-pointer">
                            {pending && <Loader size={4} />}
                            Unblock
                        </Button>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-semibold">This account isn&apos;t available</h1>
                        <p className="text-sm text-gray-600">You can&apos;t view this profile.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default BlockedNotice;
