"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import JournalArticle from "@/components/sections/JournalArticle";
import JournalCard from "@/components/sections/JournalCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { useContent } from "@/library/content";
import { slugify } from "@/library/admin/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const MORE_POSTS_COUNT = 3;

export default function JournalPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const { blogPosts } = useContent();
    const published = blogPosts.filter((p) => p.status === "Published");
    const currentIndex = published.findIndex((p) => slugify(p.title) === slug);
    const post = currentIndex === -1 ? undefined : published[currentIndex];
    const mounted = useMounted();

    if (!mounted) return <JournalPostSkeleton />;

    if (!post) {
        return (
            <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-[calc(var(--navbar-h,68px)+1.5rem)] pb-20 text-center">
                <p className="text-[13px] text-grey">
                    That post doesn&apos;t exist.{" "}
                    <Link href="/journal" className="text-pink-dark underline">
                        Back to Journal
                    </Link>
                </p>
            </div>
        );
    }

    const previousPost = currentIndex > 0 ? published[currentIndex - 1] : null;
    const nextPost = currentIndex < published.length - 1 ? published[currentIndex + 1] : null;
    const morePosts = published.filter((p) => p.id !== post.id).slice(0, MORE_POSTS_COUNT);

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-[calc(var(--navbar-h,67px))] pb-20">
            <JournalArticle post={post} />

            {(previousPost || nextPost) && (
                <div className="mx-auto mt-16 grid max-w-[1100px] grid-cols-1 divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <PostNavLink post={previousPost} direction="prev" />
                    <PostNavLink post={nextPost} direction="next" />
                </div>
            )}

            {morePosts.length > 0 && (
                <div className="mx-auto mt-24 max-w-[1100px] border-t border-ink/10 pt-14">
                    <SectionTitle num="—" title="More from the Journal" />

                    <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
                        {morePosts.map((p) => (
                            <JournalCard key={p.id} post={p} href={`/journal/${slugify(p.title)}`} sizes="(min-width: 1024px) 33vw, 100vw" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PostNavLink({
    post,
    direction,
}: {
    post: { id: number; title: string } | null;
    direction: "prev" | "next";
}) {
    const label = direction === "prev" ? "Previous" : "Next";
    const arrow = direction === "prev" ? "←" : "→";
    const align = direction === "prev" ? "sm:items-start sm:text-left" : "sm:items-end sm:text-right";

    if (!post) {
        return (
            <div className={`flex flex-col items-start gap-1.5 px-4 py-6 text-left opacity-30 ${align}`}>
                <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">
                    {direction === "prev" ? `${arrow} ${label}` : `${label} ${arrow}`}
                </span>
                <span className="text-[14px] font-medium text-ink">Nothing more yet</span>
            </div>
        );
    }

    return (
        <Link
            href={`/journal/${slugify(post.title)}`}
            className={`group flex flex-col items-start gap-1.5 px-4 py-6 text-left transition-colors hover:bg-pink-soft/30 ${align}`}
        >
            <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-grey transition group-hover:text-pink-dark">
                {direction === "prev" ? `${arrow} ${label}` : `${label} ${arrow}`}
            </span>
            <span className="text-[14px] font-medium leading-snug text-ink transition group-hover:text-pink-dark">{post.title}</span>
        </Link>
    );
}

function JournalPostSkeleton() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-[calc(var(--navbar-h,67px))] pb-20">
            <SkeletonGroup>
                <div className="relative -mx-[var(--gutter)] h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+var(--gutter)*2)] overflow-hidden">
                    <Skeleton tone="faint" className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-10 md:px-16 md:pb-12">
                        <Skeleton className="h-[11px] w-24" />
                        <Skeleton className="mt-3 h-[40px] w-[70%] max-w-[600px]" />
                    </div>
                </div>

                <div className="pt-12 mx-auto max-w-[900px]">
                    <div className="mb-8 flex items-center justify-between">
                        <Skeleton className="h-[12.5px] w-16" />
                    </div>
                    <div className="grid grid-cols-1 gap-x-14 lg:grid-cols-[minmax(0,680px)_1fr]">
                        <div>
                            <Skeleton tone="outline" className="mb-9 h-[52px] w-full" />
                            <div className="mt-9 space-y-4 border-t border-ink/10 pt-9">
                                <Skeleton tone="soft" className="h-4 w-full" />
                                <Skeleton tone="soft" className="h-4 w-full" />
                                <Skeleton tone="soft" className="h-4 w-5/6" />
                                <Skeleton tone="soft" className="h-4 w-full" />
                                <Skeleton tone="soft" className="h-4 w-2/3" />
                            </div>
                        </div>
                        <div className="hidden flex-col gap-7 border-l border-ink/10 pl-10 lg:flex">
                            <Skeleton className="h-[13px] w-20" />
                            <Skeleton className="h-[13px] w-24" />
                            <Skeleton className="h-[13px] w-16" />
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-[1100px] grid-cols-1 divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-start gap-1.5 px-4 py-6">
                            <Skeleton className="h-[10.5px] w-16" />
                            <Skeleton className="h-[14px] w-40" />
                        </div>
                    ))}
                </div>

                <div className="mx-auto mt-24 max-w-[1100px] border-t border-ink/10 pt-14">
                    <div className="mb-11 flex items-center gap-x-5">
                        <Skeleton className="h-[10.5px] w-3" />
                        <Skeleton className="h-[10.5px] w-40" />
                        <span className="h-px flex-1 bg-grey-light/40" />
                    </div>
                    <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex flex-col">
                                <Skeleton tone="faint" className="aspect-[4/3] w-full border border-ink/10" />
                                <Skeleton className="mt-5 h-[10.5px] w-24" />
                                <Skeleton className="mt-2 h-[19px] w-4/5" />
                                <Skeleton tone="soft" className="mt-2.5 h-3 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </SkeletonGroup>
        </div>
    );
}
