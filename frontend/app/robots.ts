import type { MetadataRoute } from "next";
import { SITE_URL } from "@/library/siteConfig";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/admin/", "/account", "/account/"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
