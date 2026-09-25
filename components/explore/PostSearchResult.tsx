"use client";

import TrendingSection from "./TrendingSection";
import { useEffect, useRef } from "react";
import PostPreviewCard from "../content/cards/PostPreviewCard";
import Loader from "../general/Loader";

type Props = {
    posts: { id: string; type: string; data: unknown }[];
    search: string;
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
};

const PostSearchResult = ({
    posts,
    search,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: Props) => {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Load the next page when the marker under the grid comes near.
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!hasNextPage || !el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
            },
            { rootMargin: "400px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="flex flex-col items-center">
            {isLoading && posts.length === 0 && (
                <div className="flex justify-center mt-10">
                    <Loader size={10} color="black" />
                </div>
            )}

            {/* When search is empty: show popular posts */}
            {!search && (
                <div className="w-full">
                    <p className="mb-6 mt-2 flex w-full items-center gap-2 text-sm text-gray-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/icons/searchBear.png" alt="" className="h-8 w-8 object-cover" />
                        Search posts by caption, #tag, place or person, or browse what&apos;s popular.
                    </p>
                    <TrendingSection kind="post" title="Popular posts" />
                </div>
            )}

            {search && !isLoading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/icons/searchBear.png" alt="" className="w-32 h-32 mb-4 object-cover" />
                    <p className="text-lg font-medium">No posts found.</p>
                </div>
            )}

            {posts.length > 0 && (
                <div className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 md:gap-4">
                    {posts.map((post) => (
                        <PostPreviewCard
                            key={post.id}
                            postId={post.id}
                            type={post.type}
                            content={post.data}
                            height="aspect-square"
                        />
                    ))}
                </div>
            )}

            {(isFetchingNextPage || hasNextPage) && (
                <div ref={loadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage && <Loader size={10} color="black" />}
                </div>
            )}

            {!hasNextPage && posts.length > 0 && (
                <div className="text-center py-6 text-gray-400">
                    That&apos;s all the posts we found.
                </div>
            )}
        </div>
    );
};

export default PostSearchResult;
