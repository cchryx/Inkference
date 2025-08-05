"use client";

import {
    Github,
    Instagram,
    Linkedin,
    Youtube,
    Link2,
    Mail,
    Twitch,
    MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    FaSnapchatGhost,
    FaDiscord,
    FaSpotify,
    FaRedditAlien,
    FaPinterestP,
    FaTiktok,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import { Skeleton } from "../general/Skeleton";

function getSocialIcon(link: string) {
    const lower = link.toLowerCase();

    if (lower.includes("linkedin.com"))
        return <Linkedin className="w-4 h-4 text-blue-700 shrink-0" />;
    if (lower.includes("instagram.com"))
        return <Instagram className="w-4 h-4 text-pink-500 shrink-0" />;
    if (lower.includes("github.com"))
        return (
            <Github className="w-4 h-4 text-black dark:text-white shrink-0" />
        );
    if (lower.includes("youtube.com") || lower.includes("youtu.be"))
        return <Youtube className="w-4 h-4 text-red-600 shrink-0" />;
    if (lower.includes("twitch.tv"))
        return <Twitch className="w-4 h-4 text-purple-600 shrink-0" />;
    if (lower.startsWith("mailto:") || lower.includes("gmail.com"))
        return <Mail className="w-4 h-4 text-rose-500 shrink-0" />;
    if (lower.includes("snapchat.com"))
        return <FaSnapchatGhost className="w-4 h-4 text-yellow-400 shrink-0" />;
    if (lower.includes("discord.com") || lower.includes("discord.gg"))
        return <FaDiscord className="w-4 h-4 text-indigo-500 shrink-0" />;
    if (lower.includes("spotify.com"))
        return <FaSpotify className="w-4 h-4 text-green-500 shrink-0" />;
    if (lower.includes("reddit.com"))
        return <FaRedditAlien className="w-4 h-4 text-orange-500 shrink-0" />;
    if (lower.includes("twitter.com") || lower.includes("x.com"))
        return (
            <FaXTwitter className="w-4 h-4 text-black dark:text-white shrink-0" />
        );
    if (lower.includes("pinterest.com"))
        return <FaPinterestP className="w-4 h-4 text-red-500 shrink-0" />;
    if (lower.includes("tiktok.com"))
        return <FaTiktok className="w-4 h-4 text-black shrink-0" />;

    return <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function formatSocialLabel(link: string) {
    const lower = link.toLowerCase();

    try {
        const url = new URL(link);
        const parts = url.pathname.split("/").filter(Boolean);

        if (lower.includes("instagram.com")) {
            return parts.length > 0 ? `@${parts[0]}` : "Instagram";
        }

        if (lower.includes("linkedin.com")) {
            if (parts.length >= 2 && parts[0] === "in") {
                return parts[1];
            }
            return "LinkedIn";
        }

        if (lower.includes("github.com")) {
            return parts.length > 0 ? parts[0] : "GitHub";
        }

        if (lower.includes("youtube.com")) {
            if (parts[0]?.startsWith("@")) return parts[0];
            return parts.length > 0 ? parts[parts.length - 1] : "YouTube";
        }

        if (lower.includes("youtu.be")) {
            return parts.length > 0 ? parts[0] : "YouTube";
        }

        if (lower.includes("twitter.com") || lower.includes("x.com")) {
            return parts.length > 0 ? `@${parts[0]}` : "X";
        }

        if (lower.includes("snapchat.com")) {
            return parts.length > 0 ? `@${parts[0]}` : "Snapchat";
        }

        if (lower.includes("discord.com") || lower.includes("discord.gg")) {
            return parts.length > 0 ? `discord.gg/${parts[0]}` : "Discord";
        }

        if (lower.includes("spotify.com")) {
            return parts.length > 1 ? `${parts[0]}/${parts[1]}` : "Spotify";
        }

        if (lower.includes("reddit.com")) {
            if (parts[0] === "user" && parts[1]) return `u/${parts[1]}`;
            return "Reddit";
        }

        if (lower.includes("twitch.tv")) {
            return parts.length > 0 ? `@${parts[0]}` : "Twitch";
        }

        if (lower.includes("pinterest.com")) {
            return parts.length > 0 ? `@${parts[0]}` : "Pinterest";
        }

        if (lower.includes("tiktok.com")) {
            return parts.length > 0 ? `${parts[0]}` : "TikTok";
        }

        if (lower.startsWith("mailto:") || lower.includes("gmail.com")) {
            return url.href.replace("mailto:", "");
        }

        return url.hostname.replace("www.", "");
    } catch {
        return link;
    }
}

export const SocialsCard = ({ tUser }: { tUser: any }) => {
    const { address, socialLinks = [] } = tUser;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        const loadingWidths = ["w-4/5", "w-3/4", "w-2/3", "w-9/10", "w-3/5"];

        return (
            <div className="bg-gray-200 max-h-[15rem] overflow-hidden p-2 shadow-md rounded-md">
                <div className="space-y-2 overflow-y-scroll h-full pr-1">
                    {[
                        ...Array(
                            socialLinks.length + (tUser.address ? 1 : 0) || 5
                        ),
                    ].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center space-x-2 px-2 py-1 bg-gray-300/30 rounded-sm"
                        >
                            <Skeleton className="w-4 h-4 rounded-sm" />
                            <Skeleton
                                className={`h-4 rounded-sm ${
                                    loadingWidths[i % loadingWidths.length]
                                }`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 max-h-[15rem] p-2 font-medium shadow-md rounded-md">
            <div className="overflow-y-scroll h-full pr-1">
                {/* Address */}
                {address && (
                    <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(
                            address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-2 py-1 rounded-sm cursor-pointer"
                    >
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 text-sm">
                            {address}
                        </span>
                    </a>
                )}

                {/* Social Links */}
                {socialLinks.map((link: string, index: number) => (
                    <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 hover:brightness-90 bg-gray-200 px-2 py-1 rounded-sm cursor-pointer"
                    >
                        {getSocialIcon(link)}
                        <span className="truncate flex-1 text-sm">
                            {formatSocialLabel(link)}
                        </span>
                    </a>
                ))}

                {socialLinks.length === 0 && !address && (
                    <div className="text-sm text-gray-500 h-full w-full flex items-center justify-center">
                        No location or social links provided
                    </div>
                )}
            </div>
        </div>
    );
};
