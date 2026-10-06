import type { Metadata } from "next";
import { BLOG_POSTS, slugify } from "@/library/admin/content";

export async function generateMetadata({ params }: LayoutProps<"/journal/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.filter((p) => p.status === "Published").find((p) => slugify(p.title) === slug);

    if (!post) {
        return {
            title: "Post Not Found | Cindyrella",
            description: "That post doesn't exist.",
        };
    }

    const image = typeof post.image === "string" ? post.image : post.image?.src;

    return {
        title: `${post.title} | Cindyrella`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: image ? [{ url: image }] : undefined,
        },
    };
}

export default function JournalPostLayout({ children }: LayoutProps<"/journal/[slug]">) {
    return children;
}
