import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/settings",
                    "/explore",
                    "library",
                    "social",
                    "inbox",
                ],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_API_URL}/sitemap.xml`,
    };
}
