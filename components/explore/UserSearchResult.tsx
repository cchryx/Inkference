// components/UserSearchResult.jsx
"use client";

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
    if (active !== "users") return null;

    return (
        <div className="flex flex-col items-center justify-center">
            {isUsersLoading && <Loader size={10} color="black" />}

            {/* When search is empty */}
            {!search && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    <img
                        src="/assets/icons/searchBear.png"
                        alt="Search prompt"
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

            {/* Load More */}
            {hasNextPage && users.length > 0 && (
                <button
                    disabled={isFetchingNextPage}
                    onClick={fetchNextPage}
                    className="mt-6 px-4 py-2 bg-gray-200 rounded"
                >
                    {isFetchingNextPage ? "Loading more..." : "Load more"}
                </button>
            )}
        </div>
    );
};

export default UserSearchResult;
