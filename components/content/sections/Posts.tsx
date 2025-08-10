"use client";

import PostPreviewCard from "../cards/PostPreviewCard";

type Props = {
    posts: any[];
    rootUser?: boolean;
};

const Posts = ({ posts, rootUser }: Props) => {
    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
                <PostPreviewCard
                    key={post.id}
                    type={post.type}
                    content={post.data}
                    width="w-full"
                    height="h-[400px]"
                />
            ))}
        </div>
    );
};

export default Posts;
