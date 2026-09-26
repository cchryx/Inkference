"use client";

import { MessagesBadge } from "@/components/messages/RealtimeProvider";
import { Menu, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { SignoutButton } from "../auth/SignoutButton";
import { NAVBARLEFT_LINKS, NAVBARLEFT_SUB_LINKS } from "@/constants/index";
import { UserIcon } from "../general/UserIcon";
import { UnreadBadge } from "../general/UnreadBadge";
import { NAV_COOKIE } from "@/lib/navCookie";

type NavbarLeftProps = {
    session: any;
    /** Shows the Admin link. */
    isAdmin?: boolean;
    /** Open or minimized, as you last left it (from a cookie, so there's no flicker on reload). */
    initialOpen?: boolean;
};

// Minimize by itself after this long of working in the page (clicking, typing, scrolling).
const AUTO_MINIMIZE_MS = 30_000;
// A break this long starts the count again.
const IDLE_RESET_MS = 60_000;

const saveOpen = (open: boolean) => {
    document.cookie = `${NAV_COOKIE}=${open ? "open" : "closed"}; path=/; max-age=31536000; samesite=lax`;
};

const NavbarLeft = ({ session, isAdmin = false, initialOpen = true }: NavbarLeftProps) => {
    const user = session?.user;
    const pathname = usePathname();

    const [isOpen, setIsOpenState] = useState(initialOpen);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);

    const setIsOpen = (open: boolean) => {
        setIsOpenState(open);
        saveOpen(open);
    };

    // Open: after a while of working in the page, tuck the sidebar away.
    useEffect(() => {
        if (!isOpen) return;
        let started = 0;
        let last = 0;
        const onActivity = (e: Event) => {
            if (navRef.current?.contains(e.target as Node)) {
                started = 0; // using the sidebar: keep it open
                return;
            }
            const now = Date.now();
            if (!started || now - last > IDLE_RESET_MS) started = now;
            last = now;
            if (now - started >= AUTO_MINIMIZE_MS) {
                setIsOpenState(false);
                saveOpen(false);
            }
        };
        const opts = { capture: true, passive: true } as const;
        document.addEventListener("pointerdown", onActivity, opts);
        document.addEventListener("keydown", onActivity, opts);
        document.addEventListener("wheel", onActivity, opts);
        return () => {
            document.removeEventListener("pointerdown", onActivity, opts);
            document.removeEventListener("keydown", onActivity, opts);
            document.removeEventListener("wheel", onActivity, opts);
        };
    }, [isOpen]);

    // Outside click handling
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <div
            ref={navRef}
            className={`no-drag select-none relative bg-gray-200 h-full flex flex-col transition-all duration-300 ${
                isOpen ? "w-[250px]" : "w-[64px]"
            }`}
        >
            {/* Top bar */}
            <div className="flex items-center gap-2 p-4">
                <button
                    className="p-1 rounded hover:bg-gray-400 cursor-pointer"
                    aria-label="Toggle sidebar"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Menu className="w-6 h-6 text-black" />
                </button>
                {isOpen && (
                    // Same logo as the welcome page: nib in a cut-corner plate.
                    <Link href="/" className="flex min-w-0 items-center gap-2 leading-5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center bg-neutral-900 [clip-path:polygon(5px_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%,0_5px)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/assets/brand/logo-mark-white.png"
                                alt=""
                                width={14}
                                height={14}
                                className="h-3.5 w-3.5 select-none"
                                draggable={false}
                            />
                        </span>
                        <span className="truncate font-mono text-sm font-bold tracking-[0.3em] text-black">
                            INKFERENCE
                        </span>
                    </Link>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 p-2">
                {NAVBARLEFT_LINKS.map((link: any) => {
                    const Icon = link.icon;
                    const isActive =
                        (pathname === "/" && pathname === link.route) ||
                        (pathname.startsWith(link.route) &&
                            link.route !== "/") ||
                        (pathname.startsWith("/social/") &&
                            link.route.startsWith("/social/"));

                    return (
                        <Link
                            key={link.route}
                            href={link.route}
                            className={`relative flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors bg-gray-200
                ${isOpen ? "" : "justify-center"}
                ${isActive ? "brightness-80" : "hover:brightness-90"}
            `}
                        >
                            <Icon className="w-5 h-5 text-black" />
                            {link.route.startsWith("/social") && (
                                <MessagesBadge className={isOpen ? "absolute right-3 top-1/2 -translate-y-1/2" : "absolute right-1.5 top-1.5"} />
                            )}
                            {isOpen && (
                                <span className="text-black">{link.label}</span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom user info */}
            <div className="p-2 relative">
                <div
                    className={`${
                        isOpen
                            ? "flex items-center gap-3 p-4 bg-gray-300 rounded-lg cursor-pointer hover:brightness-90"
                            : "flex justify-center cursor-pointer hover:brightness-90"
                    }`}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                >
                    <span className="relative shrink-0">
                        <UserIcon image={user.image} size="size-12" />
                        {/* Red dot when there are unread notifications */}
                        <UnreadBadge className="absolute -right-0.5 -top-0.5" />
                    </span>

                    {isOpen && (
                        <div className="flex flex-col max-w-full overflow-hidden">
                            <span className="font-semibold text-sm truncate max-w-full">
                                {user?.name || "Name"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-full">
                                {user?.username ? `@${user.username}` : ""}
                            </span>
                        </div>
                    )}
                </div>

                {/* Floating sub-menu */}
                {showUserMenu && (
                    <div
                        ref={userMenuRef}
                        className="absolute left-full bottom-0 mb-2 ml-2 w-48 bg-gray-300 rounded-sm z-50 overflow-hidden"
                    >
                        <ul className="flex flex-col">
                            {NAVBARLEFT_SUB_LINKS.filter((l) => !l.adminOnly || isAdmin).map(
                                ({ icon: Icon, route, label, action }) => {
                                    const resolvedHref =
                                        typeof route === "function"
                                            ? route(user?.username)
                                            : route;

                                    return (
                                        <li key={label}>
                                            {action === "signout" ? (
                                                <SignoutButton
                                                    onClick={() =>
                                                        setShowUserMenu(false)
                                                    }
                                                    className="flex items-center gap-2 px-4 py-2 hover:brightness-90 bg-gray-300 rounded-sm cursor-pointer text-destructive"
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{label}</span>
                                                </SignoutButton>
                                            ) : (
                                                <Link
                                                    href={resolvedHref || "/"}
                                                    onClick={() =>
                                                        setShowUserMenu(false)
                                                    }
                                                    className="flex items-center gap-2 px-4 py-2 hover:brightness-90 bg-gray-300 rounded-sm cursor-pointer"
                                                >
                                                    <Icon className="size-4 text-bold" />
                                                    <span>{label}</span>
                                            {label === "Inbox" && (
                                                <UnreadBadge variant="count" className="ml-auto" />
                                            )}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                }
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavbarLeft;
