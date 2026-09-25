"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Props = {
    text: string;
    username?: string | null;
    /** Lines shown before "more". */
    lines?: 1 | 2 | 3;
    className?: string;
    /** Called when "more"/"less" is pressed (instead of expanding inline). */
    onToggle?: (expanded: boolean) => void;
    /** Start expanded (e.g. inside an overlay). */
    expanded?: boolean;
};

const CLAMP = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" } as const;

// Splits text into plain parts, #tags and @mentions (links).
function renderRichText(text: string) {
    const parts = text.split(/([#@][\p{L}\p{N}_]+)/gu);
    return parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
            return (
                <Link
                    key={i}
                    href={`/explore?q=${encodeURIComponent(part)}`}
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </Link>
            );
        }
        if (part.startsWith("@") && part.length > 1) {
            return (
                <Link
                    key={i}
                    href={`/profile/${part.slice(1)}`}
                    className="font-medium text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </Link>
            );
        }
        return <Fragment key={i}>{part}</Fragment>;
    });
}

/**
 * Post caption like Instagram: "username caption…" clamped to a few lines,
 * with "more" only when the text really overflows.
 */
const Caption = ({ text, username, lines = 2, className = "", onToggle, expanded: forced }: Props) => {
    const [open, setOpen] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const ref = useRef<HTMLParagraphElement>(null);
    const expanded = forced ?? open;

    const rich = useMemo(() => renderRichText(text), [text]);

    // Measure whether the clamped text is cut off (instead of guessing by length).
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || expanded) return;
        const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [text, expanded, lines]);

    const toggle = (value: boolean) => {
        if (onToggle) onToggle(value);
        else setOpen(value);
    };

    if (!text) return null;

    return (
        <div className={`text-sm leading-snug ${className}`}>
            <p
                ref={ref}
                className={`whitespace-pre-wrap break-words ${expanded ? "" : CLAMP[lines]}`}
            >
                {username && (
                    <Link
                        href={`/profile/${username}`}
                        className="mr-1.5 font-semibold"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {username}
                    </Link>
                )}
                {rich}
            </p>

            {!expanded && overflows && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggle(true);
                    }}
                    className="mt-0.5 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                    more
                </button>
            )}
            {expanded && (overflows || forced !== undefined || open) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggle(false);
                    }}
                    className="mt-0.5 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                    less
                </button>
            )}
        </div>
    );
};

export default Caption;
