"use client";

import { useEffect, useState } from "react";
import { getProfileData } from "@/actions/profile/getProfileData";
import Link from "next/link";
import { Skeleton } from "@/components/general/Skeleton";

const General = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { relationships } = await getProfileData();

            const friendRequests =
                relationships?.friendRequestsReceived?.map((req: any) => ({
                    type: "friend",
                    user: req.user,
                })) || [];

            const followRequests =
                relationships?.followRequestsReceived?.map((req: any) => ({
                    type: "follow",
                    user: req.user,
                })) || [];

            setNotifications([...friendRequests, ...followRequests]);
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <ul className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <li
                        key={i}
                        className="flex items-center gap-3 bg-gray-200 px-4 py-3 rounded-md"
                    >
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded-md" />
                            <Skeleton className="h-3 w-1/2 rounded-md" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div>
            {notifications.length === 0 ? (
                <div className="text-muted-foreground">No notifications.</div>
            ) : (
                <ul className="space-y-3">
                    {notifications.map((notification, index) => (
                        <li
                            key={index}
                            className="flex items-center gap-3 bg-gray-200 px-4 py-3 rounded-md"
                        >
                            <Link
                                href={`/profile/${notification.user.username}`}
                                className="flex items-center gap-3 flex-1"
                            >
                                <img
                                    src={
                                        notification.user.image ||
                                        "/default-avatar.png"
                                    }
                                    alt={notification.user.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col truncate">
                                    <span className="font-medium truncate">
                                        {notification.user.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate">
                                        @{notification.user.username}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {notification.type === "friend"
                                            ? "Sent you a friend request."
                                            : "Requested to follow you."}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default General;
