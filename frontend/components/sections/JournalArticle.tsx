import Image from "next/image";
import { BlogPost } from "@/library/admin/types";

// Pure/presentational — takes the post directly rather than reading from the
// content store, so the same component renders both the real article page
// (looked up by slug from live data) and the admin editor's live-preview
// pane (fed the draft, possibly-unsaved post as it's being typed).
export default function JournalArticle({ post, preview = false }: { post: BlogPost; preview?: boolean }) {
    return (
        <article>
            <div className={`relative w-full overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft ${preview ? "h-[150px]" : "h-[360px]"}`}>
                {post.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- draft images can be a raw data URL string in the admin preview, not a StaticImageData next/image can optimize
                    typeof post.image === "string" ? (
                        <img src={post.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <Image src={post.image} alt={post.title} fill sizes={preview ? "400px" : "100vw"} className="object-cover" />
                    )
                )}
            </div>
            <div className={preview ? "pt-5" : "mx-auto max-w-[640px] pt-10"}>
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{post.date}</span>
                <h1 className={preview ? "mt-2 text-[20px] font-medium leading-snug text-ink" : "mt-2 text-[clamp(26px,3.5vw,40px)] font-medium leading-snug text-ink"}>
                    {post.title || "Untitled post"}
                </h1>
                {post.excerpt && <p className={preview ? "mt-3 text-[12.5px] leading-relaxed text-grey" : "mt-4 text-[15px] leading-relaxed text-grey"}>{post.excerpt}</p>}
                <div className={preview ? "mt-4 space-y-3 text-[12.5px] leading-relaxed text-ink/85" : "mt-8 space-y-5 text-[15px] leading-relaxed text-ink/85"}>
                    {(post.content || "").split("\n\n").filter(Boolean).map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
            </div>
        </article>
    );
}
