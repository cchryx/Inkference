import type { Metadata } from "next";
import PlannerList from "@/components/productivity/planner/PlannerList";
import { listDriveFiles } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Planners", robots: { index: false } };

export default async function Page() {
    const planners = await listDriveFiles("planner");
    return <PlannerList planners={planners} />;
}
