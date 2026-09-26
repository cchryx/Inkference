import type { Metadata } from "next";
import TrackerApp from "@/components/drive/trackers/TrackerApp";
import { getTrackers } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Trackers", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
    const [{ t }, trackers] = await Promise.all([searchParams, getTrackers()]);
    return <TrackerApp initialTrackers={trackers} initialId={t ?? null} />;
}
