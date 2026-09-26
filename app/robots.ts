import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

// Tells search engines what they may read. Public pages (welcome, profiles,
// projects, posts, galleries) are open; private/app pages are not.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/welcome", "/profile/", "/project/", "/post/", "/gallery/"],
                disallow: [
                    "/api/",
                    "/auth/",
                    "/serwist/",
                    "/settings",
                    "/inbox",
                    "/explore",
                    "/portfolio",
                    "/drive",
                    "/productivity",
                    "/social",
                    "/library",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
