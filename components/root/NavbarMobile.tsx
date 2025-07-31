"use client";

import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NAVBARLEFT_LINKS } from "@/constants/index";
import { SignoutButton } from "../auth/SignoutButton";

type NavbarMobileProps = {
    session: any;
};

const NavbarMobile = ({ session }: NavbarMobileProps) => {
    const pathname = usePathname();
    const user = session?.user;

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

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
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <div className="relative w-full pt-2 pb-5 bg-gray-200 border-t border-gray-300">
            {/* Menu bar */}
            <div className="flex justify-around items-center h-full">
                {/* User Icon on left */}
                <div
                    className="flex flex-col items-center text-xs cursor-pointer border-black border-2 rounded-full"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                >
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt="User avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="text-gray-300" size={14} />
                        </div>
                    )}
                </div>

                {/* Main Nav Links */}
                {NAVBARLEFT_LINKS.map((link: any) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.route;

                    return (
                        <Link
                            key={link.route}
                            href={link.route}
                            className={`flex flex-col items-center text-xs py-1 px-2 ${
                                isActive
                                    ? "bg-gray-300 rounded-md"
                                    : "hover:brightness-95"
                            }`}
                        >
                            <Icon className="w-5 h-5 text-black" />
                            <span className="text-[10px] text-black mt-1">
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Floating menu (above the avatar icon) */}
            {showUserMenu && (
                <div
                    ref={userMenuRef}
                    className="absolute bottom-[80px] left-2 z-50 w-48 bg-gray-300 rounded shadow-lg overflow-hidden"
                >
                    <ul className="flex flex-col py-1">
                        <li>
                            <Link
                                href={`${
                                    user.username
                                        ? `/profile/${user.username}`
                                        : "/"
                                }`}
                                className="flex items-center gap-2 px-4 py-2 hover:brightness-95 text-sm"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2 hover:brightness-95 text-sm"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </Link>
                        </li>
                        <li>
                            <SignoutButton
                                className="flex items-center gap-2 px-4 py-2 hover:brightness-95 text-sm text-red-600"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </SignoutButton>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NavbarMobile;
