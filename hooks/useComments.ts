"use client";

import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getComments, type CommentItem } from "@/actions/content/comment/comments";

type Page = Awaited<ReturnType<typeof getComments>>;
export const commentsKey = (postId: string) => ["comments", postId];

export function useComments(postId: string, enabled = true) {
    return useInfiniteQuery({
        queryKey: commentsKey(postId),
        queryFn: ({ pageParam }) => getComments(postId, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor,
        enabled,
        staleTime: 30_000,
    });
}

/** Update the cached comment list instantly after adding/deleting. */
export function useCommentCache(postId: string) {
    const queryClient = useQueryClient();
    const key = commentsKey(postId);

    return {
        add(comment: CommentItem) {
            queryClient.setQueryData<InfiniteData<Page>>(key, (data) =>
                data
                    ? {
                          ...data,
                          pages: data.pages.map((p, i) =>
                              i === 0 ? { ...p, comments: [comment, ...p.comments] } : p
                          ),
                      }
                    : data
            );
        },
        remove(commentId: string) {
            queryClient.setQueryData<InfiniteData<Page>>(key, (data) =>
                data
                    ? {
                          ...data,
                          pages: data.pages.map((p) => ({
                              ...p,
                              comments: p.comments.filter((c) => c.id !== commentId),
                          })),
                      }
                    : data
            );
        },
    };
}
