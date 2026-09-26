"use client";

import { Plus, Trash2 } from "lucide-react";
import { LABEL_COLORS, LIMITS, newId, type Label, type LabelColor } from "@/lib/drive";
import BoardDialog from "./BoardDialog";

type Props = { labels: Label[]; onChange: (labels: Label[]) => void; onClose: () => void };

const COLORS = Object.keys(LABEL_COLORS) as LabelColor[];

/** Add, rename, recolour or remove the labels of a planner. */
export default function LabelsModal({ labels, onChange, onClose }: Props) {
    const update = (id: string, patch: Partial<Label>) =>
        onChange(labels.map((l) => (l.id === id ? { ...l, ...patch } : l)));

    return (
        <BoardDialog title={<h2 className="text-lg font-bold">Labels</h2>} onClose={onClose} width="max-w-[440px]">
            <ul className="space-y-3">
                {labels.map((l) => (
                    <li key={l.id} className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-black/5">
                        <div className="flex items-center gap-2">
                            <span className={`size-4 shrink-0 rounded ${LABEL_COLORS[l.color]}`} />
                            <input
                                value={l.name}
                                maxLength={40}
                                onChange={(e) => update(l.id, { name: e.target.value })}
                                placeholder="Label name"
                                className="min-w-0 flex-1 rounded-md bg-gray-100 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-black"
                            />
                            <button
                                type="button"
                                onClick={() => onChange(labels.filter((x) => x.id !== l.id))}
                                aria-label={`Delete label ${l.name}`}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-6">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => update(l.id, { color: c })}
                                    aria-label={c}
                                    className={`size-5 rounded-full cursor-pointer ${LABEL_COLORS[c]} ${
                                        l.color === c ? "ring-2 ring-black ring-offset-2" : ""
                                    }`}
                                />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                disabled={labels.length >= LIMITS.labels}
                onClick={() => onChange([...labels, { id: newId(), name: "", color: COLORS[labels.length % COLORS.length] }])}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-200 cursor-pointer disabled:opacity-50"
            >
                <Plus className="size-4" /> New label
            </button>
        </BoardDialog>
    );
}
