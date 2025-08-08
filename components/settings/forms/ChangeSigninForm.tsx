"use client";

import { useState, useEffect, JSX } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/general/Skeleton";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

type Account = {
    id: string;
    provider: string;
    providerAccountId: string;
};

type Props = {
    accounts: Account[];
};

const providerMeta: Record<string, { label: string; icon?: JSX.Element }> = {
    google: {
        label: "Google",
        icon: <FcGoogle className="text-xl" />,
    },
    github: {
        label: "GitHub",
        icon: <FaGithub className="text-xl text-black" />,
    },
};

const ChangeSigninForm = ({ accounts }: Props) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md">
            <h1 className="text-lg font-semibold">Linked Sign-in Methods</h1>

            {accounts
                .filter((account) => account.provider !== "credential")
                .map((account) => (
                    <div
                        key={account.id}
                        className="flex items-center justify-between border rounded-md p-4"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 font-medium">
                                {providerMeta[account.provider]?.icon}
                                {providerMeta[account.provider]?.label ??
                                    account.provider}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {account.providerAccountId}
                            </span>
                        </div>
                        <Button className="cursor-pointer">Unlink</Button>
                    </div>
                ))}
        </div>
    );
};

export default ChangeSigninForm;
