"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Coffee, HardDrive, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { cleanUpMyStorage, getMyStorage, recountMyStorage } from "@/actions/storage";
import { SUPPORT_USERNAME, formatBytes } from "@/lib/storageConfig";

const KIND_LABELS: Record<string, string> = {
    photos: "Gallery photos",
    posts: "Posts",
    projects: "Projects",
    merits: "Merits",
    profile: "Profile and banner",
    resume: "Resume",
};

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full space-y-3 rounded-md border border-gray-200 p-4">{children}</div>
);

/** Settings > Storage: how much photo space you've used, and how to free some. */
export default function Storage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["myStorage"], queryFn: () => getMyStorage() });
    const [busy, setBusy] = useState<"recount" | "clean" | null>(null);

    const recount = async () => {
        setBusy("recount");
        const res = await recountMyStorage();
        setBusy(null);
        if ("error" in res) return toast.error(res.error);
        queryClient.setQueryData(["myStorage"], res);
    };

    const clean = async () => {
        setBusy("clean");
        const res = await cleanUpMyStorage();
        setBusy(null);
        if (res.error) return toast.error(res.error);
        toast.success(res.deleted ? `Freed up ${res.deleted} unused file${res.deleted > 1 ? "s" : ""}.` : "Nothing to clean up.");
        queryClient.invalidateQueries({ queryKey: ["myStorage"] });
    };

    if (isLoading || !data) {
        return (
            <div className="space-y-3">
                <div className="w-full space-y-3 rounded-md border border-gray-200 p-4">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
            </div>
        );
    }
    if ("error" in data) return <p className="text-sm text-gray-600">{data.error}</p>;

    const unlimited = data.limit === null;
    const pct = unlimited ? 0 : Math.min(100, (data.used / data.limit!) * 100);
    const full = !unlimited && data.used >= data.limit!;
    const barColor = full ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-gray-800";

    return (
        <div className="space-y-3">
            <Card>
                <h1 className="flex items-center gap-2 text-base font-semibold">
                    <HardDrive className="size-4" /> Photo storage
                </h1>

                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium">
                            {formatBytes(data.used)} <span className="text-gray-500 font-normal">{unlimited ? "used · unlimited" : `of ${formatBytes(data.limit!)}`}</span>
                        </span>
                        <span className="text-xs text-gray-500">{Math.round(pct)}% used</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {data.byKind.length > 0 ? (
                    <ul className="divide-y divide-gray-200 text-sm">
                        {data.byKind.map((k) => (
                            <li key={k.kind} className="flex items-center justify-between py-1.5">
                                <span>{KIND_LABELS[k.kind] ?? k.kind}</span>
                                <span className="text-gray-500 text-xs">
                                    {k.files} file{k.files === 1 ? "" : "s"} · {formatBytes(k.bytes)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No photos uploaded yet.</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="cursor-pointer" onClick={clean} disabled={!!busy}>
                        {busy === "clean" ? <Loader size={4} color="text-gray-700" /> : <Sparkles className="size-3.5" />}
                        Delete unused uploads
                    </Button>
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={recount} disabled={!!busy}>
                        {busy === "recount" ? <Loader size={4} color="text-gray-700" /> : <RefreshCw className="size-3.5" />}
                        Recount
                    </Button>
                    {data.syncedAt && (
                        <span className="text-xs text-gray-500">
                            Checked {formatDistanceToNow(data.syncedAt, { addSuffix: true })}
                        </span>
                    )}
                </div>
            </Card>

            <Card>
                <h1 className="text-base font-semibold">Why is there a limit?</h1>
                <p className="text-sm text-gray-600">
                    Inkference runs on a free plan, so everyone gets {formatBytes(data.baseLimit)} for gallery photos, posts,
                    projects and profile pictures. When you run out, new uploads are paused until you delete some old
                    ones. Removing a post, photo or project frees its space right away.
                </p>
                <p className="text-sm text-gray-600">Want to help keep it running (and get more room for everyone)?</p>
                <Button asChild size="sm" className="cursor-pointer">
                    <Link href={`/profile/${SUPPORT_USERNAME}`}>
                        <Coffee className="size-3.5" /> Buy @{SUPPORT_USERNAME} a coffee
                    </Link>
                </Button>
            </Card>
        </div>
    );
}
