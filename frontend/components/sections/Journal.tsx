"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section"
import SectionTitle from "../ui/SectionTitle"
import RevealIn from "../ui/motion/RevealIn";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";

export default function Journal(){
    const { blogPosts } = useContent();
    const published = blogPosts.filter((p) => p.status === "Published");
    const [featured, ...rest] = published;
    const posts = rest.slice(0, 3);

    if (!featured) return null;

    return(
        <SectionContainer tint="blue-soft" id="journal">
            <SectionTitle num="06" title="Journal" />

            <div className="grid grid-cols-[1.1fr_1fr] gap-10">
                <RevealIn direction="bottom">
                    <Link href={`/journal/${slugify(featured.title)}`} className="group relative isolate flex h-[460px] flex-col justify-end overflow-hidden border border-ink/10 p-9">
                        {featured.image && (
                            <Image
                                src={featured.image}
                                alt={featured.title}
                                fill
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className="absolute inset-0 -z-10 object-cover transition duration-500 group-hover:scale-[1.03]"
                                unoptimized={typeof featured.image === "string"}
                            />
                        )}
                        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <span className="eyebrow mb-3 text-white/70">Featured</span>
                        <h3 className="mb-3 max-w-[420px] text-[clamp(22px,2.4vw,32px)] font-medium text-white">{featured.title}</h3>
                        <span className="text-[12px] font-semibold uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                            Read more →
                        </span>
                    </Link>
                </RevealIn>

                <div className="flex flex-col divide-y divide-ink/10">
                    {posts.map((post, index) => (
                        <RevealIn key={post.id} direction="bottom" delay={0.14 + index * 0.14} distance={28}>
                            <Link href={`/journal/${slugify(post.title)}`} className="group flex items-center gap-5 py-6 first:pt-0 last:pb-0">
                                <div className="relative h-[86px] w-[110px] flex-shrink-0 overflow-hidden border border-ink/10">
                                    {post.image && (
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            sizes="110px"
                                            className="object-cover transition duration-500 group-hover:scale-110"
                                            unoptimized={typeof post.image === "string"}
                                        />
                                    )}
                                </div>
                                <div>
                                    <h4 className="mt-1 text-[15px] font-medium leading-snug text-ink transition group-hover:text-pink-dark">{post.title}</h4>
                                    <p className="mt-1 line-clamp-2 max-w-[280px] text-[12.5px] text-grey">{post.excerpt}</p>
                                </div>
                            </Link>
                        </RevealIn>
                    ))}
                </div>
            </div>
        </SectionContainer>
    )
}
