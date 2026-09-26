"use client";

import Link from "next/link";
import { ChevronLeft, Kanban, Plus } from "lucide-react";
import { PlannerTile } from "@/components/productivity/Tiles";
import Loader from "@/components/general/Loader";
import { useCreatePlanner } from "./useCreatePlanner";
import type { DriveFileSummary } from "@/lib/drive";

export default function PlannerList({ planners }: { planners: DriveFileSummary[] }) {
    const { create, creating } = useCreatePlanner();

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-6">
            <div>
                <Link href="/productivity" className="flex w-fit items-center text-sm text-gray-600 hover:text-black">
                    <ChevronLeft className="size-4" /> Productivity
                </Link>
                <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Planners</h1>
                        <p className="text-xs sm:text-sm text-gray-500">Boards for schedules, plans and projects.</p>
                    </div>
                    <button
                        type="button"
                        onClick={create}
                        disabled={creating}
                        className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
                    >
                        {creating ? <Loader size={4} /> : <Plus className="size-4" />} New planner
                    </button>
                </div>
            </div>

            {planners.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planners.map((p) => (
                        <PlannerTile key={p.id} planner={p} />
                    ))}
                    <button
                        type="button"
                        onClick={create}
                        disabled={creating}
                        className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
                    >
                        <Plus className="size-5" /> New planner
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 text-center">
                    <Kanban className="size-10 text-gray-300" />
                    <div>
                        <p className="font-semibold">No planners yet</p>
                        <p className="text-sm text-gray-500">Make a board with lists and cards to plan anything.</p>
                    </div>
                    <button
                        type="button"
                        onClick={create}
                        disabled={creating}
                        className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white cursor-pointer"
                    >
                        Create your first planner
                    </button>
                </div>
            )}
        </div>
    );
}
