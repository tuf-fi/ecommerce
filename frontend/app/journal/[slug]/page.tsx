"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import JournalArticle from "@/components/sections/JournalArticle";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";

export default function JournalPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const { blogPosts } = useContent();
    const post = blogPosts.find((p) => p.status === "Published" && slugify(p.title) === slug);

    if (!post) {
        return (
            <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20 text-center">
                <p className="text-[13px] text-grey">
                    That post doesn&apos;t exist.{" "}
                    <Link href="/journal" className="text-pink-dark underline">
                        Back to Journal
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <Link href="/journal" className="mb-8 inline-block text-[12.5px] font-medium text-grey hover:text-pink-dark">
                ← Journal
            </Link>
            <JournalArticle post={post} />
        </div>
    );
}
