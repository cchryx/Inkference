"use client";

import { Menu, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { SignoutButton } from "../auth/SignoutButton";
import { NAVBARLEFT_LINKS } from "@/constants/index";

type NavbarLeftProps = {
    session: any;
};

const NavbarLeft = ({ session }: NavbarLeftProps) => {
    const user = session?.user;
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);

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
                    <span className="text-lg font-semibold text-black">
                        Inkference
                    </span>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 p-2">
                {NAVBARLEFT_LINKS.map((link: any) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.route;

                    return (
                        <Link
                            key={link.route}
                            href={link.route}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors bg-gray-200
                ${isOpen ? "" : "justify-center"}
                ${isActive ? "brightness-80" : "hover:brightness-90"}
            `}
                        >
                            <Icon className="w-5 h-5 text-black" />
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
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt="User profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="text-gray-300" size={20} />
                        </div>
                    )}

                    {isOpen && (
                        <div className="flex flex-col">
                            <span className="font-semibold">
                                {user?.name || "Name"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {user?.username
                                    ? `@${user.username}`
                                    : user?.email
                                    ? `@${user.email.split("@")[0]}`
                                    : "@username"}
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
                            <li>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-4 py-2 hover:brightness-90 bg-gray-300 rounded-sm cursor-pointer"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 px-4 py-2 hover:brightness-90 bg-gray-300 rounded-sm cursor-pointer"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </Link>
                            </li>
                            <li>
                                <SignoutButton className="flex items-center gap-2 px-4 py-2 hover:brightness-90 bg-gray-300 rounded-sm cursor-pointer text-destructive">
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </SignoutButton>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavbarLeft;
