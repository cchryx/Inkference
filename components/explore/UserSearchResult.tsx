"use client";

import { useEffect, useRef } from "react";
import UserCard from "../content/cards/UserCard";
import Loader from "../general/Loader";

type Props = {
    active: string;
    users: any[];
    search: string;
    isUsersLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
};

const UserSearchResult = ({
    active,
    users,
    search,
    isUsersLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: Props) => {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasNextPage || !loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "150px" }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (active !== "users") return null;

    return (
        <div className="flex flex-col items-center justify-center">
            {/* Initial loading */}
            {isUsersLoading && users.length === 0 && (
                <div className="flex justify-center mt-10">
                    <Loader size={10} color="black" />
                </div>
            )}

            {/* When search is empty */}
            {!search && !isUsersLoading && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    <img
                        src="/assets/icons/searchBear.png"
                        className="w-32 h-32 mb-4 object-cover"
                    />
                    <p className="text-lg font-medium">
                        Start typing to search for users.
                    </p>
                </div>
            )}

            {/* When search has no results */}
            {search && !isUsersLoading && users.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    <img
                        src="/assets/icons/searchBear.png"
                        alt="No users"
                        className="w-32 h-32 mb-4 object-cover"
                    />
                    <p className="text-lg font-medium">No users found.</p>
                </div>
            )}

            {/* Results */}
            {users.length > 0 && (
                <div className="flex flex-col w-full">
                    {users.map((user) => (
                        <UserCard
                            key={user.id}
                            id={user.id}
                            username={user.username}
                            name={user.name}
                            image={user.image}
                        />
                    ))}
                </div>
            )}

            {/* Loader + sentinel */}
            {(isFetchingNextPage || hasNextPage) && (
                <div ref={loadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage && <Loader size={10} color="black" />}
                </div>
            )}

            {/* End of results */}
            {!hasNextPage && users.length > 0 && (
                <div className="text-center py-4 text-gray-400">
                    That’s all the users we found.
                </div>
            )}
        </div>
    );
};

export default UserSearchResult;
