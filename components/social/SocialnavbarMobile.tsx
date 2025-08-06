"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SOCIALNAVBAR_LINKS } from "@/constants";

const SocialnavbarMobile = () => {
    const pathname = usePathname();

    return (
        <div className="bg-gray-200 z-30 md:hidden py-2 px-3 select-none">
            <ul className="flex justify-center gap-4">
                {SOCIALNAVBAR_LINKS.map((link) => {
                    const isActive = pathname === link.route;
                    const Icon = link.icon;

                    return (
                        <li
                            key={link.label}
                            className={`group relative rounded-lg transition bg-gray-200 ${
                                isActive
                                    ? "brightness-[90%]"
                                    : "hover:brightness-[90%]"
                            }`}
                        >
                            <Link
                                href={link.route}
                                className="relative flex flex-col items-center p-2"
                            >
                                <Icon className="size-5 transition" />
                                <span
                                    className={`absolute bg-gray-200 top-full mt-2 text-xs py-1 px-2 rounded-lg shadow-lg 
                                        transition-all duration-200 
                                        group-hover:opacity-100 group-hover:pointer-events-auto 
                                        opacity-0 pointer-events-none`}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {link.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SocialnavbarMobile;
