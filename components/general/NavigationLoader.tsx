"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PageLoader from "./PageLoader";
import { NAV_START_EVENT } from "@/lib/navigation";

/*
 * Shows the loading screen THE MOMENT you tap a link to another page,
 * instead of waiting for the server to answer. It covers the page, so
 * repeated taps while it's loading do nothing. It disappears as soon as
 * the new page's address is active.
 */

const SAFETY_TIMEOUT_MS = 12_000;

function targetPath(href: string) {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin ? url.pathname + url.search : null;
}

export default function NavigationLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current = pathname + (searchParams.toString() ? `?${searchParams}` : "");

    const [pending, setPending] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // The new page is showing: hide the loader.
    const [lastCurrent, setLastCurrent] = useState(current);
    if (current !== lastCurrent) {
        setLastCurrent(current);
        setPending(null);
    }

    useEffect(() => {
        const start = (href: string | null) => {
            if (!href) return;
            const path = targetPath(href);
            if (!path || path === window.location.pathname + window.location.search) return;
            setPending(path);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setPending(null), SAFETY_TIMEOUT_MS);
        };

        // Any normal left-click on an internal link.
        const onClick = (e: MouseEvent) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = (e.target as Element | null)?.closest?.("a");
            if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
            if (a.getAttribute("href")?.startsWith("#")) return;
            start(a.href);
        };

        // router.push() via useNavigate().
        const onStart = (e: Event) => start((e as CustomEvent<{ href: string }>).detail?.href ?? null);

        // Back/forward buttons.
        const onPop = () => setPending(null);

        document.addEventListener("click", onClick, true);
        window.addEventListener(NAV_START_EVENT, onStart);
        window.addEventListener("popstate", onPop);
        return () => {
            document.removeEventListener("click", onClick, true);
            window.removeEventListener(NAV_START_EVENT, onStart);
            window.removeEventListener("popstate", onPop);
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    if (!pending) return null;

    return (
        <div className="absolute inset-0 z-40" aria-busy="true" aria-live="polite">
            <PageLoader pathname={pending.split("?")[0]} />
        </div>
    );
}
