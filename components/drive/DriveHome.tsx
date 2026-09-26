"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CalendarCheck, ChevronRight, FileText, HardDrive, Pin, Plus, StickyNote, Table, Tv } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import SeeAll from "@/components/general/SeeAll";
import { createDriveFile } from "@/actions/drive/drive";
import { BOARD_COLORS, type DriveFileSummary } from "@/lib/drive";

type Props = { notes: DriveFileSummary[]; trackers: DriveFileSummary[] };

const KINDS = [
    { type: "note" as const, label: "Note", hint: "Quick thoughts and lists", icon: StickyNote, tint: "bg-amber-100 text-amber-700" },
    { type: "tracker" as const, label: "Tracker", hint: "Episodes you're on, next-episode links", icon: Tv, tint: "bg-violet-100 text-violet-700" },
];

const SOON = [
    { label: "Doc", icon: FileText },
    { label: "Sheet", icon: Table },
];

export default function DriveHome({ notes, trackers }: Props) {
    const router = useRouter();
    const [creating, setCreating] = useState<"note" | "tracker" | null>(null);

    const create = async (type: "note" | "tracker") => {
        setCreating(type);
        const { error, id } = await createDriveFile(type);
        if (error || !id) {
            setCreating(null);
            return toast.error(error ?? "Couldn't create it.");
        }
        router.push(type === "note" ? `/drive/notes?n=${id}` : `/drive/trackers?t=${id}`);
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-8">
            <header className="flex items-center gap-3">
                <div className="rounded-xl bg-black text-white p-2.5">
                    <HardDrive className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold leading-tight">Drive</h1>
                    <p className="text-sm text-gray-500">Your notes and files. Only you can see them.</p>
                </div>
            </header>

            {/* Create */}
            <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Create</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {KINDS.map((k) => (
                        <button
                            key={k.type}
                            type="button"
                            onClick={() => create(k.type)}
                            disabled={!!creating}
                            className="group flex flex-col items-start gap-3 rounded-xl bg-gray-100 hover:bg-gray-200 p-4 text-left transition-colors cursor-pointer disabled:opacity-60"
                        >
                            <span className={`rounded-lg p-2 ${k.tint}`}>
                                {creating === k.type ? <Loader size={5} color="text-current" /> : <k.icon className="size-5" />}
                            </span>
                            <span>
                                <span className="flex items-center gap-1 font-semibold">
                                    <Plus className="size-3.5" /> {k.label}
                                </span>
                                <span className="block text-xs text-gray-500">{k.hint}</span>
                            </span>
                        </button>
                    ))}
                    {SOON.map((s) => (
                        <div
                            key={s.label}
                            className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-gray-300 p-4 text-gray-400"
                        >
                            <span className="rounded-lg bg-gray-100 p-2">
                                <s.icon className="size-5" />
                            </span>
                            <span>
                                <span className="block font-semibold">{s.label}</span>
                                <span className="block text-xs">Coming soon</span>
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Notes */}
            <Section title="Notes" href="/drive/notes" count={notes.length} icon={StickyNote}>
                {notes.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {notes.map((n) => (
                            <Link
                                key={n.id}
                                href={`/drive/notes?n=${n.id}`}
                                className="rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 p-4 transition-colors"
                            >
                                <div className="flex items-start gap-2">
                                    <p className="font-semibold truncate flex-1">{n.title || "New note"}</p>
                                    {n.pinned && <Pin className="size-3.5 text-amber-600 shrink-0 mt-1" />}
                                </div>
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2 min-h-10">
                                    {n.preview || <span className="text-gray-400">No additional text</span>}
                                </p>
                                <p className="mt-2 text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Empty text="No notes yet." action="New note" onClick={() => create("note")} />
                )}
            </Section>

            {/* Trackers */}
            <Section title="Trackers" href="/drive/trackers" count={trackers.length} icon={Tv}>
                {trackers.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {trackers.map((t) => (
                            <Link
                                key={t.id}
                                href={`/drive/trackers?t=${t.id}`}
                                className="flex gap-3 rounded-xl bg-gray-100 p-4 hover:bg-gray-200 transition-colors"
                            >
                                <span className={`w-1 shrink-0 rounded-full ${BOARD_COLORS[t.color ?? "purple"].band}`} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold">{t.title || "Tracker"}</span>
                                    <span className="block text-xs text-gray-500">
                                        {t.trackerStats?.watching ?? 0} watching · {t.trackerStats?.completed ?? 0} completed
                                    </span>
                                    {t.preview && <span className="mt-1 block truncate text-sm text-gray-600">{t.preview}</span>}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Empty text="No trackers yet." action="New tracker" onClick={() => create("tracker")} />
                )}
            </Section>

            {/* Planners and to-dos live in Productivity now */}
            <Link
                href="/productivity"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
            >
                <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
                    <CalendarCheck className="size-5" />
                </span>
                <span className="flex-1">
                    <span className="block font-semibold">Looking for planners and to-dos?</span>
                    <span className="block text-xs text-gray-500">They&apos;re in Productivity.</span>
                </span>
                <ChevronRight className="size-4 text-gray-500" />
            </Link>
        </div>
    );
}

function Section({
    title,
    href,
    count,
    icon: Icon,
    children,
}: {
    title: string;
    href: string;
    count: number;
    icon: typeof StickyNote;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className="size-5" /> {title}
                </h2>
                {count > 0 && (
                    <SeeAll href={href} />
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 text-sm text-gray-500">
            {text}
            <button type="button" onClick={onClick} className="font-semibold text-black hover:underline cursor-pointer">
                {action}
            </button>
        </div>
    );
}
