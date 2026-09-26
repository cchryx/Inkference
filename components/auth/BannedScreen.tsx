import { Ban } from "lucide-react";
import { SignoutButton } from "@/components/auth/SignoutButton";

type Props = { reason: string; until: Date | null; username?: string | null };

/** Shown instead of the app while an account is banned. */
export default function BannedScreen({ reason, until, username }: Props) {
    const when = until
        ? until.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" })
        : null;

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-md ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-red-100 text-red-600">
                        <Ban className="size-5" />
                    </span>
                    <div>
                        <h1 className="text-lg font-semibold">Your account is suspended</h1>
                        {username && <p className="text-xs text-gray-500">@{username}</p>}
                    </div>
                </div>

                <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</p>
                    <p className="whitespace-pre-wrap">{reason}</p>
                </div>

                <p className="text-sm text-gray-700">
                    {when ? (
                        <>
                            You can use Inkference again after <span className="font-semibold">{when}</span> (Toronto
                            time).
                        </>
                    ) : (
                        <>This suspension doesn&apos;t end.</>
                    )}
                </p>
                <p className="text-xs text-gray-500">
                    Think this is a mistake? Email <a className="underline" href="mailto:inkference@gmail.com">inkference@gmail.com</a>.
                </p>

                <SignoutButton className="w-full cursor-pointer">Sign out</SignoutButton>
            </div>
        </div>
    );
}
