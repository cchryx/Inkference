import { cache } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPostPage, getSimilarPosts } from "@/actions/content/post/getPostPage";
import { ReturnButton } from "@/components/auth/ReturnButton";
import PostView from "@/components/content/post/view/PostView";
import PostPreviewCard from "@/components/content/cards/PostPreviewCard";
import { previewUrl } from "@/lib/imageUrl";
import JsonLd from "@/components/general/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";

// Shared between generateMetadata and the page, so the post is loaded once.
const loadPost = cache(getPostPage);

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const data = await loadPost(id);

    if (!data) {
        return {
            title: "Post not found",
            description: "This post does not exist or may have been removed.",
            robots: { index: false },
        };
    }

    const { post } = data;
    const title = `Post by ${post.author.name} (@${post.author.username})`;
    const description = post.description?.slice(0, 160) || `A post by @${post.author.username}`;
    const image = post.content[0] ? previewUrl(post.content[0], 1200) : undefined;

    return {
        title,
        description,
        alternates: { canonical: `/post/${post.id}` },
        openGraph: { title, description, images: image ? [{ url: image }] : [] },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    const data = await loadPost(id);

    if (!data) {
        return (
            <div className="flex justify-center items-center h-full w-full p-4">
                <div className="bg-gray-100 p-8 rounded shadow-md space-y-2">
                    <ReturnButton href="/" label="Home" />
                    <h1 className="text-xl font-semibold">Post Not Found</h1>
                    <p>This post does not exist or may have been removed.</p>
                </div>
            </div>
        );
    }

    // Project posts already have their own page.
    if (data.post.type === "project") redirect(`/project/${data.post.dataId}`);

    const similar = await getSimilarPosts({
        id: data.post.id,
        tags: data.post.tags,
        location: data.post.location,
        authorId: data.post.author.id,
    });

    const { post } = data;

    return (
        <div className="w-full max-w-5xl mx-auto md:px-6 md:py-6 pb-24 md:pb-10">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "SocialMediaPosting",
                    url: `${SITE_URL}/post/${post.id}`,
                    headline: (post.description || `Post by @${post.author.username}`).slice(0, 110),
                    articleBody: post.description || undefined,
                    image: post.content.slice(0, 4).map((img) => previewUrl(img, 1200)),
                    datePublished: new Date(post.createdAt).toISOString(),
                    keywords: post.tags.length ? post.tags.join(", ") : undefined,
                    author: {
                        "@type": "Person",
                        name: post.author.name,
                        url: `${SITE_URL}/profile/${post.author.username}`,
                    },
                    interactionStatistic: [
                        { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.stats.likes },
                        { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: post.stats.comments },
                    ],
                }}
            />
            <PostView {...data} />

            {similar.length > 0 && (
                <section className="mt-8 md:mt-12">
                    <h2 className="px-4 md:px-0 mb-3 text-sm font-semibold text-gray-600">
                        More posts like this
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 md:gap-4">
                        {similar.map((p) => (
                            <PostPreviewCard
                                key={p.id}
                                postId={p.id}
                                type={p.type}
                                content={p.data}
                                height="aspect-square"
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
