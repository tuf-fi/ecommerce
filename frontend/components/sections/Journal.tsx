"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section"
import SectionTitle from "../ui/SectionTitle"
import RevealIn from "../ui/motion/RevealIn";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";

export default function Journal(){
    const { blogPosts, sectionVisibility } = useContent();
    const published = blogPosts.filter((p) => p.status === "Published");
    const [featured, ...rest] = published;
    const posts = rest.slice(0, 3);

    if (!sectionVisibility.journal) return null;
    if (!featured) return null;

    return(
        <SectionContainer tint="blue-soft" id="journal">
            <SectionTitle num="06" title="Journal" />

            <div className="grid grid-cols-[1.1fr_1fr] gap-14">
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
                            <Link href={`/journal/${slugify(post.title)}`} className="group flex items-center gap-6 py-8 first:pt-0 last:pb-0">
                                <div className="relative h-[96px] w-[124px] flex-shrink-0 overflow-hidden border border-ink/10">
                                    {post.image && (
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            sizes="124px"
                                            className="object-cover transition duration-500 group-hover:scale-110"
                                            unoptimized={typeof post.image === "string"}
                                        />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-medium leading-snug text-ink transition group-hover:text-pink-dark">{post.title}</h4>
                                    <p className="mt-2 line-clamp-2 max-w-[280px] text-[12.5px] leading-relaxed text-grey">{post.excerpt}</p>
                                </div>
                            </Link>
                        </RevealIn>
                    ))}
                </div>
            </div>

            <RevealIn direction="bottom" delay={0.14 + posts.length * 0.14}>
                <div className="mt-14 flex justify-center">
                    <Link
                        href="/journal"
                        className="group/cta inline-flex items-center gap-2.5 bg-navy px-8 py-4 text-[13px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        View All Journal Entries
                        <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                    </Link>
                </div>
            </RevealIn>
        </SectionContainer>
    )
}
