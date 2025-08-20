"use client";

import PostPreviewCard from "../cards/PostPreviewCard";

type Props = {
    posts: any[];
    rootUser?: boolean;
};

const Posts = ({ posts, rootUser = false }: Props) => {
    if (!posts || posts.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not posted anything yet."
                    : "You have not posted anything yet. You can try creating one now."}
            </div>
        );
    }

    return (
        <div className="my-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 lg:gap-6">
            {posts.map((post) => (
                <PostPreviewCard
                    key={post.id}
                    type={post.type}
                    content={post.data}
                    width="w-full"
                    height="h-[20vh] md:h-[35vh]"
                />
            ))}
        </div>
    );
};

export default Posts;
