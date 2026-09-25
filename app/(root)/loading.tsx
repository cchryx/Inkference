"use client";

import { usePathname } from "next/navigation";
import PageLoader from "@/components/general/PageLoader";

export default function Loading() {
    return <PageLoader pathname={usePathname()} />;
}
