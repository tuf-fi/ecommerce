"use client";

import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/library/admin/types";
import { useStore } from "@/library/store";

const WORDS_PER_MINUTE = 200;

// Pure/presentational (post passed in) so it renders both the real article page and the admin preview pane; useStore is safe since it wraps admin too.
export default function JournalArticle({ post, preview = false }: { post: BlogPost; preview?: boolean }) {
    const { showToast } = useStore();

    function handleShare() {
        navigator.clipboard
            .writeText(typeof window !== "undefined" ? window.location.href : "")
            .then(() => showToast("success", "Link copied."))
            .catch(() => showToast("error", "Couldn't copy the link."));
    }

    const wordCount = (post.content || "").trim().split(/\s+/).filter(Boolean).length;
    const readMins = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

    if (preview) {
        return (
            <article>
                <div className="relative h-[150px] w-full overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                    {post.image && (
                        // eslint-disable-next-line @next/next/no-img-element -- draft images can be a raw data URL string in the admin preview, not a StaticImageData next/image can optimize
                        typeof post.image === "string" ? (
                            <img src={post.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <Image src={post.image} alt={post.title} fill sizes="400px" className="object-cover" />
                        )
                    )}
                </div>

                <div className="px-9 pt-5">
                    <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{post.date}</span>
                    <h1 className="mt-2 text-[20px] font-medium leading-snug text-ink">{post.title || "Untitled post"}</h1>
                    {post.excerpt && <p className="mt-3 text-[12.5px] leading-relaxed text-grey">{post.excerpt}</p>}
                    <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-ink/85">
                        {(post.content || "").split("\n\n").filter(Boolean).map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article>
            {post.image ? (
                <div className="relative -mx-8 h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+4rem)] overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                    {typeof post.image === "string" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- draft images can be a raw data URL string, not a StaticImageData next/image can optimize
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                        <Image src={post.image} alt={post.title} fill priority sizes="100vw" className="object-cover" />
                    )}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-10 md:px-16 md:pb-12">
                        <span className="font-mono text-[11px] uppercase tracking-[.16em] text-white/70">{post.date}</span>
                        <h1 className="mt-3 max-w-[820px] text-[clamp(28px,4.2vw,50px)] font-medium leading-[1.1] text-white">
                            {post.title || "Untitled post"}
                        </h1>
                    </div>
                </div>
            ) : (
                <header className="mx-auto max-w-[680px]">
                    <span className="font-mono text-[11px] uppercase tracking-[.16em] text-grey">{post.date}</span>
                    <h1 className="mt-3 text-[clamp(28px,4.2vw,44px)] font-medium leading-[1.1] text-ink">
                        {post.title || "Untitled post"}
                    </h1>
                </header>
            )}

            <div className={`mx-auto max-w-[900px] ${post.image ? "pt-10" : "pt-6"}`}>
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link href="/journal" className="inline-block text-[12.5px] font-medium text-grey transition-colors hover:text-pink-dark">
                        ← Journal
                    </Link>
                    <button
                        onClick={handleShare}
                        className="text-[12px] font-medium text-grey transition-colors hover:text-pink-dark lg:hidden"
                    >
                        Copy link
                    </button>
                </div>

                {/* Grid layout keeps a metadata/share rail alongside the copy instead of stacked above the fold. */}
                <div className="grid grid-cols-1 gap-x-14 lg:grid-cols-[minmax(0,680px)_1fr]">
                    <div>
                        {post.excerpt && (
                            <p className="border-l-2 border-pink pl-5 text-[18px] font-medium leading-relaxed text-ink/80">
                                {post.excerpt}
                            </p>
                        )}
                        <div className="mt-9 space-y-6 border-t border-ink/10 pt-9 text-[15.5px] leading-[1.85] text-ink/85">
                            {(post.content || "").split("\n\n").filter(Boolean).map((para, i) => (
                                <p key={i} className={i === 0 ? "text-[17px] leading-[1.75] text-ink" : undefined}>
                                    {para}
                                </p>
                            ))}
                        </div>
                    </div>

                    <aside className="hidden lg:sticky lg:top-[calc(var(--navbar-h,72px)+24px)] lg:flex lg:h-fit lg:flex-col lg:gap-7 lg:self-start lg:border-l lg:border-ink/10 lg:pl-10">
                        <div>
                            <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-grey">Published</span>
                            <span className="mt-1.5 block text-[13px] text-ink">{post.date}</span>
                        </div>
                        <div>
                            <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-grey">Reading Time</span>
                            <span className="mt-1.5 block text-[13px] text-ink">{readMins} min read</span>
                        </div>
                        <div>
                            <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-grey">Share</span>
                            <button
                                onClick={handleShare}
                                className="mt-1.5 text-[13px] text-ink underline decoration-ink/20 underline-offset-2 transition-colors hover:text-pink-dark hover:decoration-pink-dark/40"
                            >
                                Copy link
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </article>
    );
}
