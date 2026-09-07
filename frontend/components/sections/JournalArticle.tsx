import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/library/admin/types";

// Pure/presentational — takes the post directly rather than reading from the
// content store, so the same component renders both the real article page
// (looked up by slug from live data) and the admin editor's live-preview
// pane (fed the draft, possibly-unsaved post as it's being typed).
export default function JournalArticle({ post, preview = false }: { post: BlogPost; preview?: boolean }) {
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

            <div className="pt-12 mx-auto max-w-[680px]">
                    <Link href="/journal" className="mb-8 inline-block text-[12.5px] font-medium text-grey hover:text-pink-dark">
                        ← Journal
                    </Link>
                </div>

            <div className={`mx-auto max-w-[680px] ${post.image ? "pt-12" : "pt-6"}`}>
                {post.excerpt && (
                    <p className="border-l-2 border-pink pl-5 text-[18px] font-medium leading-relaxed text-ink/80">
                        {post.excerpt}
                    </p>
                )}
                <div className="mt-9 space-y-6 border-t border-ink/10 pt-9 text-[15.5px] leading-[1.85] text-ink/85">
                    {(post.content || "").split("\n\n").filter(Boolean).map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
            </div>
        </article>
    );
}
