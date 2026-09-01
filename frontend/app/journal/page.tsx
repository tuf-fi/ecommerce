"use client";

import Image from "next/image";
import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";

export default function JournalIndexPage() {
    const { blogPosts } = useContent();
    const published = blogPosts.filter((p) => p.status === "Published");

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <SectionTitle num="06" title="Journal" />

            {published.length === 0 ? (
                <p className="py-16 text-center text-[13px] text-grey">Nothing published yet — check back soon.</p>
            ) : (
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                    {published.map((post) => (
                        <Link key={post.id} href={`/journal/${slugify(post.title)}`} className="group flex flex-col">
                            <div className="relative aspect-[4/3] w-full overflow-hidden border border-ink/10">
                                {post.image && (
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                        unoptimized={typeof post.image === "string"}
                                    />
                                )}
                            </div>
                            <span className="mt-4 font-mono text-[10px] uppercase tracking-[.16em] text-grey">{post.date}</span>
                            <h3 className="mt-1.5 text-[17px] font-medium leading-snug text-ink transition group-hover:text-pink-dark">{post.title}</h3>
                            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-grey">{post.excerpt}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
