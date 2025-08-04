"use client";

import { useEffect, useState } from "react";
import { getProfileData } from "@/actions/profile/getProfileData";
import Link from "next/link";
import { Skeleton } from "@/components/general/Skeleton";
import { UserCheck, UserX } from "lucide-react";

const Requests = () => {
    const [followRequestsReceived, setFollowRequestsReceived] = useState<any[]>(
        []
    );
    const [friendRequestsReceived, setFriendRequestsReceived] = useState<any[]>(
        []
    );
    const [followRequestsSent, setFollowRequestsSent] = useState<any[]>([]);
    const [friendRequestsSent, setFriendRequestsSent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { relationships } = await getProfileData();
            setFollowRequestsReceived(
                relationships?.followRequestsReceived || []
            );
            setFriendRequestsReceived(
                relationships?.friendRequestsReceived || []
            );
            setFollowRequestsSent(relationships?.followRequestsSent || []);
            setFriendRequestsSent(relationships?.friendRequestsSent || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 bg-gray-200 px-3 py-2 rounded-md"
                    >
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const renderRequestList = (
        title: string,
        requests: any[],
        isReceived: boolean
    ) => (
        <div>
            <h4 className="text-lg mb-2">{title}</h4>
            <ul className="space-y-2">
                {requests.map((req: any) => (
                    <li
                        key={req.userId}
                        className="flex items-center gap-3 bg-gray-200 px-3 py-2 rounded-md"
                    >
                        <Link
                            href={`/profile/${req.user.username}`}
                            className="cursor-pointer flex items-center gap-3 flex-1"
                        >
                            <img
                                src={req.user.image || "/default-avatar.png"}
                                alt={req.user.username}
                                width={40}
                                height={40}
                                className="rounded-full object-cover w-10 h-10"
                            />
                            <div className="flex flex-col truncate">
                                <span className="font-medium truncate">
                                    {req.user.name}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                    @{req.user.username}
                                </span>
                            </div>
                        </Link>

                        {isReceived ? (
                            <div className="flex gap-2">
                                <button
                                    className="p-2 rounded-md bg-green-500 text-white hover:brightness-[90%] transition cursor-pointer"
                                    onClick={() => {
                                        /* Handle Accept */
                                    }}
                                >
                                    <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2 rounded-md bg-red-500 text-white hover:brightness-[90%] transition cursor-pointer"
                                    onClick={() => {
                                        /* Handle Decline */
                                    }}
                                >
                                    <UserX className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                className="px-3 py-1 cursor-pointer rounded-md bg-gray-500 text-white hover:bg-gray-600 transition text-sm"
                                onClick={() => {
                                    /* Handle Cancel */
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="space-y-6">
            {(friendRequestsReceived.length > 0 ||
                followRequestsReceived.length > 0) && (
                <div>
                    {friendRequestsReceived.length > 0 &&
                        renderRequestList(
                            "Friend Requests",
                            friendRequestsReceived,
                            true
                        )}
                    {followRequestsReceived.length > 0 &&
                        renderRequestList(
                            "Follow Requests",
                            followRequestsReceived,
                            true
                        )}
                </div>
            )}

            {(friendRequestsSent.length > 0 ||
                followRequestsSent.length > 0) && (
                <div>
                    {friendRequestsSent.length > 0 &&
                        renderRequestList(
                            "Friend Requests Sent",
                            friendRequestsSent,
                            false
                        )}
                    {followRequestsSent.length > 0 &&
                        renderRequestList(
                            "Follow Requests Sent",
                            followRequestsSent,
                            false
                        )}
                </div>
            )}

            {followRequestsReceived.length === 0 &&
                friendRequestsReceived.length === 0 &&
                followRequestsSent.length === 0 &&
                friendRequestsSent.length === 0 && (
                    <div className="text-muted-foreground">
                        No pending requests.
                    </div>
                )}
        </div>
    );
};

export default Requests;
