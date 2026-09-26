import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlannerBoard from "@/components/productivity/planner/PlannerBoard";
import { getPlanner } from "@/actions/drive/drive";
import { getPreferences } from "@/actions/preferences";

export const metadata: Metadata = { title: "Planner", robots: { index: false } };

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ view?: string }>;
}) {
    const [{ id }, { view }] = await Promise.all([params, searchParams]);
    const [planner, prefs] = await Promise.all([getPlanner(id), getPreferences()]);
    // A ?view= link wins; otherwise open the view you used last.
    const initialView = view === "board" || view === "week" || view === "calendar" ? view : (prefs.plannerView ?? "board");
    if (!planner) notFound();
    return (
        <PlannerBoard
            id={planner.id}
            initialTitle={planner.title}
            initialBoard={planner.board}
            initialView={initialView}
        />
    );
}
