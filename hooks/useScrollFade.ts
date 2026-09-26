"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const SIZE = 28; // px of fade at each end

/**
 * Fades the top/bottom of a scrolling box when there's more to scroll,
 * instead of showing a scrollbar. Put `ref` and `style` on the box
 * (and `onScroll`). Works on any background, since it's a mask.
 */
export function useScrollFade<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [edges, setEdges] = useState({ top: false, bottom: false });

    const update = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const top = el.scrollTop > 2;
        const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
        setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
    }, []);

    // Re-check when the box or its content changes size (cards added, etc.).
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(update);
        observer.observe(el);
        for (const child of Array.from(el.children)) observer.observe(child);
        const mutations = new MutationObserver(() => {
            for (const child of Array.from(el.children)) observer.observe(child);
            update();
        });
        mutations.observe(el, { childList: true });
        update();
        return () => {
            observer.disconnect();
            mutations.disconnect();
        };
    }, [update]);

    const mask =
        edges.top || edges.bottom
            ? `linear-gradient(to bottom, ${edges.top ? "transparent" : "black"} 0, black ${edges.top ? SIZE : 0}px, black calc(100% - ${
                  edges.bottom ? SIZE : 0
              }px), ${edges.bottom ? "transparent" : "black"} 100%)`
            : undefined;

    const style: CSSProperties | undefined = mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined;
    return { ref, style, onScroll: update };
}
