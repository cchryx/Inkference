"use client";

import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NAVBARLEFT_LINKS, NAVBARLEFT_SUB_LINKS } from "@/constants/index";
import { SignoutButton } from "../auth/SignoutButton";
import { UserIcon } from "../general/UserIcon";
import { UnreadBadge } from "../general/UnreadBadge";

type NavbarMobileProps = {
    session: any;
};

const NavbarMobile = ({ session }: NavbarMobileProps) => {
    const pathname = usePathname();
    const user = session?.user;

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                userMenuRef.current &&
                avatarRef.current &&
                !userMenuRef.current.contains(event.target as Node) &&
                !avatarRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <div className="relative overflow-hidden fixed w-full pt-2 pb-5 bg-gray-200 border-t border-gray-300">
            {/* Menu bar */}
            {/* Equal-width slots, so every icon lines up no matter how long its label is */}
            <div className="flex items-center h-full px-1">
                {/* User Icon on left */}
                <div className="flex flex-1 basis-0 justify-center">
                    <div
                        ref={avatarRef}
                        className="flex flex-col items-center text-xs cursor-pointer border-black border-2 rounded-full"
                        onClick={() => setShowUserMenu((prev) => !prev)}
                    >
                        <span className="relative shrink-0">
                            <UserIcon image={user.image} size="size-8" />
                            {/* Red dot when there are unread notifications */}
                            <UnreadBadge className="absolute -right-0.5 -top-0.5" />
                        </span>
                    </div>
                </div>

                {/* Main Nav Links */}
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
                            className={`flex min-w-0 flex-1 basis-0 flex-col items-center rounded-md py-1 text-xs ${
                                isActive ? "bg-gray-300" : "hover:brightness-95"
                            }`}
                        >
                            <Icon className="w-5 h-5 text-black" />
                            <span className="mt-1 w-full truncate text-center text-[10px] leading-3 text-black">
                                {link.shortLabel ?? link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Floating menu (above the avatar icon) */}
            {showUserMenu && (
                <div
                    ref={userMenuRef}
                    className="fixed bottom-[80px] left-2 z-50 w-48 bg-gray-300 rounded-lg shadow-lg overflow-hidden"
                >
                    <ul className="flex flex-col py-1">
                        {NAVBARLEFT_SUB_LINKS.map(
                            ({ icon: Icon, label, route, action }) => {
                                const href =
                                    typeof route === "function"
                                        ? route(user?.username)
                                        : route;

                                if (action === "signout") {
                                    return (
                                        <li key={label}>
                                            <SignoutButton
                                                className="flex items-center gap-2 px-4 py-2 hover:brightness-95 text-sm text-red-600 cursor-pointer"
                                                onClick={() =>
                                                    setShowUserMenu(false)
                                                }
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{label}</span>
                                            </SignoutButton>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={label}>
                                        <Link
                                            href={href || "/"}
                                            onClick={() =>
                                                setShowUserMenu(false)
                                            }
                                            className="flex items-center gap-2 px-4 py-2 hover:brightness-95 text-sm"
                                        >
                                            <Icon className="size-4 text-bold" />
                                            <span>{label}</span>
                                            {label === "Inbox" && (
                                                <UnreadBadge variant="count" className="ml-auto" />
                                            )}
                                        </Link>
                                    </li>
                                );
                            }
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NavbarMobile;
