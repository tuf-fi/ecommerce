"use client";

import Image from "next/image";
import Link from "next/link";
import RevealIn from "@/components/ui/motion/RevealIn";
import JournalCard from "@/components/sections/JournalCard";
import PageIntro from "@/components/sections/PageIntro";
import SectionTitle from "@/components/ui/SectionTitle";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function JournalIndexPage() {
    const { blogPosts } = useContent();
    const published = blogPosts.filter((p) => p.status === "Published");
    const [featured, ...rest] = published;
    const mounted = useMounted();

    if (!mounted) return <JournalSkeleton />;

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <PageIntro pageKey="journal" />

            {!featured ? (
                <p className="py-16 text-center text-[13px] text-grey">Nothing published yet — check back soon.</p>
            ) : (
                <>
                    <SectionTitle num="—" title={`${published.length} ${published.length === 1 ? "Entry" : "Entries"}`} />

                    <RevealIn direction="bottom">
                        <Link
                            href={`/journal/${slugify(featured.title)}`}
                            className="group relative isolate mb-14 flex h-[420px] flex-col justify-end overflow-hidden sm:h-[520px]"
                        >
                            {featured.image && (
                                <Image
                                    src={featured.image}
                                    alt={featured.title}
                                    fill
                                    priority
                                    sizes="100vw"
                                    className="absolute inset-0 -z-10 object-cover transition duration-500 group-hover:scale-[1.03]"
                                    unoptimized={typeof featured.image === "string"}
                                />
                            )}
                            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="px-8 pb-9 sm:px-12 sm:pb-12">
                                <span className="font-mono text-[11px] uppercase tracking-[.16em] text-white/70">Latest</span>
                                <h2 className="mt-3 max-w-[680px] text-[clamp(26px,3.6vw,44px)] font-medium leading-[1.1] text-white">
                                    {featured.title}
                                </h2>
                                <span className="mt-4 inline-block text-[12px] font-semibold uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                                    Read more →
                                </span>
                            </div>
                        </Link>
                    </RevealIn>

                    {rest.length > 0 && (
                        // The most recent post gets a spanning, larger-typed slot instead of an equal grid tile.
                        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                            {rest.map((post, index) => {
                                const lead = index === 0;
                                return (
                                    <RevealIn
                                        key={post.id}
                                        direction="bottom"
                                        delay={index * 0.08}
                                        distance={28}
                                        className={lead ? "sm:col-span-2" : undefined}
                                    >
                                        <JournalCard post={post} href={`/journal/${slugify(post.title)}`} size={lead ? "large" : "default"} />
                                    </RevealIn>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function JournalSkeleton() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <SkeletonGroup>
                <Skeleton className="mt-3 h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                <Skeleton className="mt-3 mb-11 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />

                <div className="mb-11 flex items-center gap-x-5">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-20" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <Skeleton tone="faint" className="mb-14 h-[420px] w-full sm:h-[520px]" />

                <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col sm:col-span-2">
                        <Skeleton tone="faint" className="aspect-[16/9] w-full border border-ink/10" />
                        <Skeleton className="mt-6 h-[11px] w-28" />
                        <Skeleton className="mt-2.5 h-[28px] w-3/5" />
                        <Skeleton tone="soft" className="mt-3 h-3.5 w-4/5" />
                    </div>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex flex-col">
                            <Skeleton tone="faint" className="aspect-[4/3] w-full border border-ink/10" />
                            <Skeleton className="mt-5 h-[10.5px] w-24" />
                            <Skeleton className="mt-2 h-[19px] w-4/5" />
                            <Skeleton tone="soft" className="mt-2.5 h-3 w-full" />
                            <Skeleton tone="soft" className="mt-1.5 h-3 w-2/3" />
                        </div>
                    ))}
                </div>
            </SkeletonGroup>
        </div>
    );
}
