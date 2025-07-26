"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/general/Skeleton";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    X,
    Github,
    Instagram,
    Linkedin,
    Youtube,
    Link2,
    AlertCircle,
    Mail,
    Twitch,
} from "lucide-react";
import { changeProfileAction } from "@/actions/changeProfileAction";
import { set } from "date-fns";
import { getProfileChangeStatus } from "@/actions/getProfileChangeStatus";
import {
    FaDiscord,
    FaPinterestP,
    FaRedditAlien,
    FaSnapchatGhost,
    FaSpotify,
    FaTwitter,
    FaWeixin,
} from "react-icons/fa";

type Props = {
    socialLinks: string[] | null;
    isLoading?: boolean;
};

const MAX_LINKS = 12;

const ChangeSocialsForm = ({ socialLinks, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [linkInput, setLinkInput] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [links, setLinks] = useState<string[]>(socialLinks || []);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading) {
            setLinks(socialLinks || []);
            getProfileChangeStatus("socialLinks").then(setStatus);
        }
    }, [isLoading]);

    const isLinkValid = linkInput.trim().length > 0;
    const maxLinksReached = links.length >= MAX_LINKS;

    function handleAddLink() {
        if (!isLinkValid || maxLinksReached) return;
        setLinks((prev) => [...prev, linkInput.trim()]);
        setLinkInput("");
        setShowInput(false);
    }

    function handleRemove(index: number) {
        setLinks((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        const formData = new FormData();
        formData.append("socialLinks", JSON.stringify(links));

        const { error } = await changeProfileAction(formData, "socialLinks");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Social links changed successfully.");
            getProfileChangeStatus("socialLinks").then(setStatus);
        }

        setIsPending(false);
    }

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
            return (
                <FaSnapchatGhost className="w-4 h-4 text-yellow-400 shrink-0" />
            );
        if (lower.includes("discord.com") || lower.includes("discord.gg"))
            return <FaDiscord className="w-4 h-4 text-indigo-500 shrink-0" />;
        if (lower.includes("spotify.com"))
            return <FaSpotify className="w-4 h-4 text-green-500 shrink-0" />;
        if (lower.includes("wechat.com") || lower.includes("weixin.qq.com"))
            return <FaWeixin className="w-4 h-4 text-green-600 shrink-0" />;
        if (lower.includes("reddit.com"))
            return (
                <FaRedditAlien className="w-4 h-4 text-orange-500 shrink-0" />
            );
        if (lower.includes("twitter.com") || lower.includes("x.com"))
            return (
                <FaTwitter className="w-4 h-4 text-black dark:text-white shrink-0" />
            );
        if (lower.includes("pinterest.com"))
            return <FaPinterestP className="w-4 h-4 text-red-500 shrink-0" />;

        return <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />;
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <Skeleton className="h-10 w-2/5 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-[160px] rounded-md" />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col space-y-4 border-gray-200 border-2 p-6 rounded-md"
        >
            <h1 className="text-lg">Social Links</h1>

            <div className="flex flex-col gap-2 relative">
                {" "}
                {links.length > 0 && (
                    <ul className="space-y-1">
                        {links.map((link, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between text-sm text-muted-foreground bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-sm"
                            >
                                <span className="flex items-center gap-2 max-w-full overflow-hidden">
                                    <span className="shrink-0">
                                        {getSocialIcon(link)}
                                    </span>
                                    <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                        {link}
                                    </p>
                                </span>
                                <button
                                    type="button"
                                    disabled={isPending || !status.canChange}
                                    onClick={() => handleRemove(index)}
                                    className="ml-2 text-gray-400 hover:text-red-500 cursor-pointer transition-all duration-200 hover:rotate-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {showInput && !maxLinksReached && (
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter social link"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            disabled={isPending || !status.canChange}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={handleAddLink}
                            disabled={
                                !isLinkValid || isPending || !status.canChange
                            }
                        >
                            Add
                        </Button>
                    </div>
                )}
                {!showInput && !maxLinksReached && (
                    <Button
                        type="button"
                        onClick={() => setShowInput(true)}
                        className="w-fit"
                        disabled={isPending || !status.canChange}
                    >
                        + Add Link
                    </Button>
                )}
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your social links now."
                        : `You can change your social links again in ${status.timeLeft}.`}
                </p>
                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {MAX_LINKS - links.length > 0
                        ? `You can add up to 6 links. ${
                              MAX_LINKS - links.length
                          } left.
`
                        : `You have reached the maximum of ${MAX_LINKS} social links.`}
                </p>
            </div>
            <Button
                type="submit"
                className="cursor-pointer w-fit"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Save Social Links
            </Button>
        </form>
    );
};

export default ChangeSocialsForm;
