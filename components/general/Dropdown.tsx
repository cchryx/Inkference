"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: ReactNode; hint?: string };

type Props = {
    value: string;
    options: (string | DropdownOption)[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    /** "sm" for tight spots (cards, toolbars). */
    size?: "sm" | "md";
    className?: string;
    "aria-label"?: string;
    title?: string;
};

const norm = (o: string | DropdownOption): DropdownOption => (typeof o === "string" ? { value: o, label: o } : o);

/**
 * The one dropdown used everywhere: white rounded box, white rounded list
 * with a soft shadow, a tick next to what's picked. The list floats above
 * everything (so popups and scroll areas never cut it off) and opens
 * upwards when there's no room below.
 */
export default function Dropdown({
    value,
    options,
    onChange,
    placeholder = "Select",
    disabled,
    size = "md",
    className = "",
    title,
    ...rest
}: Props) {
    const items = options.map(norm);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number } | null>(null);
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLUListElement>(null);

    const selected = items.find((i) => i.value === value);

    // Place the list under (or above) the box.
    const place = () => {
        const r = button.current?.getBoundingClientRect();
        if (!r) return;
        const below = window.innerHeight - r.bottom - 8;
        const above = r.top - 8;
        const up = below < 200 && above > below;
        const width = Math.max(r.width, 140);
        const left = Math.min(r.left, window.innerWidth - width - 8);
        setPos(
            up
                ? { left, bottom: window.innerHeight - r.top + 4, width, maxHeight: Math.min(280, above) }
                : { left, top: r.bottom + 4, width, maxHeight: Math.min(280, below) }
        );
    };

    const openList = () => {
        if (disabled) return;
        place();
        setActive(Math.max(0, items.findIndex((i) => i.value === value)));
        setOpen(true);
    };

    const pick = (v: string) => {
        onChange(v);
        setOpen(false);
        button.current?.focus();
    };

    // Show the picked item when the list opens.
    useLayoutEffect(() => {
        if (!open || !panel.current) return;
        const el = panel.current.querySelector<HTMLElement>(`[data-index="${active}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    // Close on outside click, Escape, or when the page scrolls/resizes.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            const t = e.target as Node;
            if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
        };
        const onScroll = (e: Event) => {
            if (!panel.current?.contains(e.target as Node)) setOpen(false);
        };
        const onResize = () => setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
                e.preventDefault();
                openList();
            }
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (items[active]) pick(items[active].value);
        } else if (e.key === "Tab") {
            setOpen(false);
        }
    };

    const sm = size === "sm";

    return (
        <>
            <button
                ref={button}
                type="button"
                disabled={disabled}
                title={title}
                aria-label={rest["aria-label"]}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => (open ? setOpen(false) : openList())}
                onKeyDown={onKeyDown}
                className={`flex min-w-0 items-center justify-between gap-1.5 rounded-lg bg-white text-left font-normal normal-case tracking-normal text-gray-900 ring-1 ring-black/10 outline-none transition hover:ring-black/25 focus-visible:ring-2 focus-visible:ring-black/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    sm ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                } ${className}`}
            >
                <span className={`truncate ${selected ? "" : "text-gray-400"}`}>{selected?.label ?? placeholder}</span>
                <ChevronDown className={`shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""} ${sm ? "size-3" : "size-4"}`} />
            </button>

            {open &&
                pos &&
                createPortal(
                    <ul
                        ref={panel}
                        role="listbox"
                        className="scroll-thin fixed z-[1000] overflow-y-auto rounded-xl bg-white p-1 text-sm shadow-lg ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100"
                        style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, maxWidth: Math.max(pos.width, 320), maxHeight: pos.maxHeight }}
                    >
                        {items.map((item, i) => {
                            const isSel = item.value === value;
                            return (
                                <li
                                    key={item.value}
                                    data-index={i}
                                    role="option"
                                    aria-selected={isSel}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => pick(item.value)}
                                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer ${
                                        i === active ? "bg-gray-100" : ""
                                    } ${isSel ? "font-semibold text-black" : "text-gray-800"}`}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">{item.label}</span>
                                        {item.hint && <span className="block text-xs font-normal text-gray-500">{item.hint}</span>}
                                    </span>
                                    <Check className={`size-3.5 shrink-0 ${isSel ? "opacity-100" : "opacity-0"}`} />
                                </li>
                            );
                        })}
                    </ul>,
                    document.body
                )}
        </>
    );
}
