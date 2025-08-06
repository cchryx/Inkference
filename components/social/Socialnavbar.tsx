"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SOCIALNAVBAR_LINKS } from "@/constants";

const Socialnavbar = () => {
    const pathname = usePathname();

    return (
        <div className="bg-gray-200 z-30 hidden md:block py-4 px-2 select-none">
            <ul className="flex flex-col gap-3">
                {SOCIALNAVBAR_LINKS.map((link) => {
                    const isActive = pathname === link.route;
                    const Icon = link.icon;

                    return (
                        <li
                            key={link.label}
                            className={`group relative rounded-lg transition bg-gray-200 ${
                                isActive
                                    ? "brightness-[80%]"
                                    : "hover:brightness-[90%]"
                            }`}
                        >
                            <Link
                                href={link.route}
                                className="relative flex items-center gap-4 p-2"
                            >
                                <Icon className={`size-6 transition`} />
                                <span
                                    className={`absolute bg-gray-200 right-full mr-2 text-sm py-1 px-2 rounded-lg shadow-lg 
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

export default Socialnavbar;
