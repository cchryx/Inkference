"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../general/Skeleton";
import { toast } from "sonner";
import { recommendUsers } from "@/actions/users/recomendUsers";
import { UserIcon } from "../general/UserIcon";
import Link from "next/link";

type RecommendedUser = {
    id: string;
    name: string;
    username: string;
    image: string | null;
    reason: string;
};

const RecommendedAccountsCard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [recommendedAccounts, setRecommendedAccounts] = useState<
        RecommendedUser[]
    >([]);

    useEffect(() => {
        async function fetchRecommendations() {
            setIsLoading(true);
            try {
                const { error, ...data } = await recommendUsers();

                if (error) {
                    toast.error(error);
                    setRecommendedAccounts([]);
                } else {
                    setRecommendedAccounts(
                        data.recommendedUsers as unknown as RecommendedUser[]
                    );
                }
            } catch {
                toast.error("Failed to load recommendations.");
                setRecommendedAccounts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRecommendations();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-gray-200 h-[20rem] p-3 shadow-md rounded-md w-full flex flex-col">
                <Skeleton className="w-[60%] h-6 mb-3 rounded-md" />
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-2 rounded hover:bg-gray-300"
                        >
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="w-[50%] h-3 rounded-sm" />
                                <Skeleton className="w-[30%] h-2 rounded-sm" />
                                <Skeleton className="w-[80%] h-2 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 h-[20rem] p-3 shadow-md rounded-md w-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Recommended Accounts</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 yes-scrollbar">
                {recommendedAccounts.length === 0 && (
                    <div className="text-center text-gray-600">
                        No recommendations found.
                    </div>
                )}
                {recommendedAccounts.map((account, index) => (
                    <Link
                        key={index}
                        href={`/profile/${account.username}`}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-300 p-2 rounded"
                    >
                        <UserIcon image={account.image} size="size-10" />
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                                {account.name}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                                @{account.username}
                            </div>
                            <div className="text-xs text-gray-700 mt-1 truncate">
                                {account.reason}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecommendedAccountsCard;
