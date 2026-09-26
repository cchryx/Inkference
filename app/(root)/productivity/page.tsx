import type { Metadata } from "next";
import ProductivityHome from "@/components/productivity/ProductivityHome";
import { getDueItems, listDriveFiles } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Productivity", robots: { index: false } };

export default async function Page() {
    const [planners, todoLists, due] = await Promise.all([
        listDriveFiles("planner", 6),
        listDriveFiles("todo", 9),
        getDueItems(14),
    ]);
    return <ProductivityHome planners={planners} todoLists={todoLists} due={due} />;
}
