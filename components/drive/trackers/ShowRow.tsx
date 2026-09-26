"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, ChevronDown, ExternalLink, Minus, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import Dropdown from "@/components/general/Dropdown";
import { TRACKER_STATUSES, episodeLink, type TrackerItem } from "@/lib/drive";
import LinkEditor from "./LinkEditor";

type Props = {
    item: TrackerItem;
    band: string;
    open: boolean;
    onToggleOpen: () => void;
    onChange: (item: TrackerItem) => void;
    onDelete: () => void;
};

const STATUS_DOT = { watching: "bg-green-500", planned: "bg-gray-400", completed: "bg-sky-500" } as const;

/** One show: episode counter, "next episode" button, and its details. */
export default function ShowRow({ item, band, open, onToggleOpen, onChange, onDelete }: Props) {
    const [editingEp, setEditingEp] = useState(false);
    const set = (patch: Partial<TrackerItem>) => onChange({ ...item, ...patch, updatedAt: new Date().toISOString() });
    const done = item.status === "completed";
    const next = item.episode + 1;
    const nextUrl = episodeLink(item.link, next);
    const currentUrl = item.episode > 0 ? episodeLink(item.link, item.episode) : null;
    const pct = item.total ? Math.min(100, (item.episode / item.total) * 100) : null;

    // Just opens the next episode. You count it yourself with + when you're done.
    const watchNext = () => {
        if (nextUrl) window.open(nextUrl, "_blank", "noopener,noreferrer");
    };

    // One more episode watched (reaching the total marks it completed).
    const countUp = () => {
        const finished = !!item.total && next >= item.total;
        set({ episode: next, status: finished ? "completed" : item.status === "planned" ? "watching" : item.status });
    };

    return (
        <li className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${done ? "opacity-75" : ""}`}>
            <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 md:px-4">
                <span className={`h-10 w-1 shrink-0 rounded-full ${band}`} />
                <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left cursor-pointer">
                    <span className="flex items-center gap-1.5">
                        <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[item.status]}`} />
                        <span className={`truncate text-sm font-semibold md:text-base ${done ? "line-through decoration-gray-400" : ""}`}>
                            {item.name}
                        </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {item.episode === 0 ? "Not started" : `Episode ${item.episode}`}
                        {item.total ? ` of ${item.total}` : ""} · {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                    </span>
                </button>

                {/* Episode counter */}
                <div className="flex shrink-0 items-center rounded-lg bg-gray-100">
                    <button
                        type="button"
                        onClick={() => item.episode > 0 && set({ episode: item.episode - 1 })}
                        aria-label="One episode back"
                        className="rounded-l-lg p-2 text-gray-600 hover:bg-gray-200 cursor-pointer disabled:opacity-40 sm:p-1.5"
                        disabled={item.episode === 0}
                    >
                        <Minus className="size-3.5" />
                    </button>
                    {editingEp ? (
                        <input
                            autoFocus
                            type="number"
                            min={0}
                            defaultValue={item.episode}
                            onBlur={(e) => {
                                setEditingEp(false);
                                const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                if (v !== item.episode) set({ episode: v });
                            }}
                            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            className="w-14 bg-white px-1 py-1 text-center text-sm tabular-nums outline-none ring-1 ring-black/20"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingEp(true)}
                            title="Type an episode number"
                            className="min-w-8 px-1 text-center text-sm font-semibold tabular-nums cursor-text sm:min-w-10 sm:px-1.5"
                        >
                            {item.episode}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={countUp}
                        aria-label="One episode forward"
                        className="rounded-r-lg p-2 text-gray-600 hover:bg-gray-200 cursor-pointer sm:p-1.5"
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>

                {done ? (
                    <button
                        type="button"
                        onClick={() => set({ status: "watching" })}
                        title="Watch again"
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-100 cursor-pointer"
                    >
                        <RotateCcw className="size-3.5" /> <span className="hidden sm:inline">Rewatch</span>
                    </button>
                ) : nextUrl ? (
                    <button
                        type="button"
                        onClick={watchNext}
                        title={`Open episode ${next} (press + when you've watched it)`}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-black px-2.5 py-2 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer sm:py-1.5"
                    >
                        <Play className="size-3.5 fill-current" />
                        <span className="tabular-nums">
                            <span className="hidden sm:inline">Ep </span>
                            {next}
                        </span>
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={onToggleOpen}
                    aria-label="Details"
                    aria-expanded={open}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer"
                >
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {pct !== null && (
                <div className="h-0.5 w-full bg-gray-100">
                    <div className={`h-full ${done ? "bg-sky-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                </div>
            )}

            {open && (
                <div className="space-y-3 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <label className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500">Name</span>
                            <input
                                value={item.name}
                                maxLength={200}
                                onChange={(e) => set({ name: e.target.value })}
                                onBlur={() => !item.name.trim() && set({ name: "Untitled" })}
                                className="w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500">Episode</span>
                            <input
                                type="number"
                                min={0}
                                value={item.episode}
                                onChange={(e) => set({ episode: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                                className="w-full rounded-lg bg-white px-3 py-2 text-sm tabular-nums ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40 sm:w-24"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500">Total (optional)</span>
                            <input
                                type="number"
                                min={1}
                                value={item.total ?? ""}
                                placeholder="?"
                                onChange={(e) => {
                                    const v = Math.floor(Number(e.target.value));
                                    set({ total: v > 0 ? v : null });
                                }}
                                className="w-full rounded-lg bg-white px-3 py-2 text-sm tabular-nums ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40 sm:w-28"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Status</span>
                        <Dropdown
                            size="sm"
                            value={item.status}
                            onChange={(v) => set({ status: v as TrackerItem["status"] })}
                            options={TRACKER_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
                        />
                        {!done && (
                            <button
                                type="button"
                                onClick={() => set({ status: "completed" })}
                                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ring-1 ring-gray-300 hover:bg-white cursor-pointer"
                            >
                                <Check className="size-3.5" /> Mark completed
                            </button>
                        )}
                        {currentUrl && (
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                            >
                                <ExternalLink className="size-3.5" /> Open episode {item.episode}
                            </a>
                        )}
                    </div>

                    <LinkEditor
                        value={item.link}
                        episode={item.episode}
                        onChange={(link, episode) => set(episode === undefined ? { link } : { link, episode })}
                    />

                    <textarea
                        value={item.notes}
                        maxLength={2000}
                        onChange={(e) => set({ notes: e.target.value })}
                        placeholder="Notes (season, where you left off...)"
                        className="w-full min-h-14 resize-none rounded-lg bg-white p-2.5 text-sm outline-none ring-1 ring-black/10 field-sizing-content focus:ring-2 focus:ring-black/40"
                    />

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                            <Trash2 className="size-3.5" /> Remove show
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}
