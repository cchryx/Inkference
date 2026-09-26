"use client";

import { useState } from "react";
import { Link2, X } from "lucide-react";
import { EP_TOKEN, episodeLink, linkParts } from "@/lib/drive";

type Props = {
    value: string;
    episode: number;
    /** `episode` is set when picking the number from a pasted link (that's the episode you're on). */
    onChange: (link: string, episode?: number) => void;
};

/**
 * Where the episodes are. Paste any episode's link, then tap the number in
 * it that's the episode. It becomes {ep}, so "next" can open the right one.
 */
export default function LinkEditor({ value, episode, onChange }: Props) {
    const [draft, setDraft] = useState(value);
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        setDraft(value);
    }

    const ready = draft.includes(EP_TOKEN);
    const isUrl = /^https?:\/\//i.test(draft.trim());
    const preview = episodeLink(draft, episode + 1);
    const parts = linkParts(draft);
    const hasNumbers = parts.some((p) => p.isNumber);

    const commit = (link: string, ep?: number) => {
        setDraft(link);
        onChange(link.trim(), ep);
    };

    // Tap a number: that spot becomes {ep} (and it's probably the episode you're on).
    const pick = (index: number) => {
        const picked = Number(parts[index].text);
        const link = parts.map((p, i) => (i === index ? EP_TOKEN : p.text)).join("");
        commit(link, episode === 0 && picked > 0 ? picked : undefined);
    };

    return (
        <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <Link2 className="size-3.5" /> Episode link
            </span>
            <div className="flex items-center gap-1.5">
                <input
                    value={draft}
                    maxLength={500}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => draft.trim() !== value && commit(draft.trim())}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    placeholder="Paste a link to any episode"
                    className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/40"
                />
                {draft && (
                    <button
                        type="button"
                        onClick={() => commit("")}
                        aria-label="Remove link"
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {draft && !isUrl && <p className="text-xs text-amber-700">Links need to start with https://</p>}

            {isUrl && !ready && hasNumbers && (
                <div className="space-y-1 rounded-lg bg-white p-2.5 ring-1 ring-black/5">
                    <p className="text-xs text-gray-600">Tap the number that&apos;s the episode:</p>
                    <p className="break-all font-mono text-xs leading-6">
                        {parts.map((p, i) =>
                            p.isNumber ? (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => pick(i)}
                                    className="rounded bg-amber-100 px-1 font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200 cursor-pointer"
                                >
                                    {p.text}
                                </button>
                            ) : (
                                <span key={i} className="text-gray-500">
                                    {p.text}
                                </span>
                            )
                        )}
                    </p>
                </div>
            )}

            {isUrl && !ready && !hasNumbers && (
                <p className="text-xs text-gray-500">
                    No number in this link. Type {EP_TOKEN} where the episode number goes.
                </p>
            )}

            {ready && preview && (
                <p className="truncate text-xs text-gray-500">
                    Next opens: <span className="font-mono text-gray-700">{preview}</span>
                </p>
            )}
        </div>
    );
}
