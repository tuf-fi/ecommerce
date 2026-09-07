import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/library/products";
import { BLOG_POSTS, RITUALS_DEFAULT, STATIC_PAGES, slugify } from "@/library/admin/content";
import { SITE_URL } from "@/library/siteConfig";

// Built from the same static seed data the dynamic routes' generateMetadata
// already reads (see shop/[id], journal/[slug], rituals/[id]) — there's no
// backend yet, so this is the full set of real, crawlable URLs.
export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.7 },
        ...STATIC_PAGES.map((page) => ({
            url: `${SITE_URL}/pages/${page.slug}`,
            changeFrequency: "monthly" as const,
            priority: 0.3,
        })),
    ];

    const productRoutes: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
        url: `${SITE_URL}/shop/${product.id}`,
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const journalRoutes: MetadataRoute.Sitemap = BLOG_POSTS.filter((post) => post.status === "Published").map((post) => ({
        url: `${SITE_URL}/journal/${slugify(post.title)}`,
        changeFrequency: "monthly",
        priority: 0.6,
    }));

    const ritualRoutes: MetadataRoute.Sitemap = RITUALS_DEFAULT.map((ritual) => ({
        url: `${SITE_URL}/rituals/${ritual.id}`,
        changeFrequency: "monthly",
        priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...journalRoutes, ...ritualRoutes];
}
