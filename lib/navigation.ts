"use client";

import { useRouter } from "next/navigation";

/*
 * Lets code that navigates with router.push() show the loading screen
 * straight away (links do this automatically, see NavigationLoader).
 */

export const NAV_START_EVENT = "app:navigation-start";

export function startNavigation(href: string) {
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: { href } }));
}

/** Like router.push, but shows the loader immediately. */
export function useNavigate() {
    const router = useRouter();
    return (href: string) => {
        startNavigation(href);
        router.push(href);
    };
}
