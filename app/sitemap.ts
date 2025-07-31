import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://inkference.vercel.app",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
            images: ["/icon512_rounded.png"],
        },
    ];
}
