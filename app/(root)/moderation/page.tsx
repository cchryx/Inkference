import type { Metadata } from "next";
import MyCases from "@/components/moderation/MyCases";

export const metadata: Metadata = { title: "Account review", robots: { index: false } };

export default function Page() {
    return <MyCases />;
}
