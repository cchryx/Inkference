"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import { getMessageAccess, startDirect } from "@/actions/messages";

/** "Message" on someone's profile. Says "Send request" when it'll land in their requests. Hidden if they don't take messages from you. */
export default function MessageButton({ userId, isFriend }: { userId: string; isFriend: boolean }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const { data, isError } = useQuery({
        queryKey: ["messageAccess", userId, isFriend],
        queryFn: () => getMessageAccess(userId),
        staleTime: 60_000,
        retry: 1,
    });
    // If the check itself fails, still show the button (starting the chat re-checks).
    const access = data ?? (isError ? "direct" : undefined);

    if (!access || access === "closed") return null;

    const go = async () => {
        setBusy(true);
        const res = await startDirect(userId).catch((err) => {
            console.error(err);
            return { error: "Something went wrong. Try again.", id: null };
        });
        if (res.error || !res.id) {
            setBusy(false);
            return toast.error(res.error ?? "Couldn't open the chat.");
        }
        router.push(`/social/messages?c=${res.id}`);
    };

    return (
        <button
            onClick={go}
            disabled={busy}
            className="flex items-center gap-2 rounded-sm bg-gray-300 px-3 py-1 text-sm transition hover:bg-gray-400 cursor-pointer disabled:cursor-wait"
        >
            {busy ? <Loader size={4} color="text-gray-600" /> : <MessageCircle className="h-4 w-4" />}
            {access === "direct" ? "Message" : "Send request"}
        </button>
    );
}
