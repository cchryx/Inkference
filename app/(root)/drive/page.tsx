import type { Metadata } from "next";
import DriveHome from "@/components/drive/DriveHome";
import { listDriveFiles } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Drive", robots: { index: false } };

export default async function Page() {
    const notes = await listDriveFiles("note", 9);
    return <DriveHome notes={notes} />;
}
