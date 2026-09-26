"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** After tapping the email link (?verified=1): say so, then tidy the link. */
export default function VerifiedToast() {
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("verified") !== "1") return;
        toast.success("Email verified. Welcome to Inkference!");
        url.searchParams.delete("verified");
        window.history.replaceState(null, "", url);
    }, []);
    return null;
}
