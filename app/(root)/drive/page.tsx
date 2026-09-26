import type { Metadata } from "next";
import DriveHome from "@/components/drive/DriveHome";
import { listDriveFiles } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Drive", robots: { index: false } };

export default async function Page() {
    const [notes, trackers] = await Promise.all([listDriveFiles("note", 9), listDriveFiles("tracker", 6)]);
    return <DriveHome notes={notes} trackers={trackers} />;
}
