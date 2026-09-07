import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/library/admin/types";

// Shared card markup for a blog post teaser — used by both the /journal
// listing grid and the "More from the Journal" block on the detail page, so
// the two stay visually identical instead of drifting via copy-pasted JSX.
// Pure/presentational (post + href in, no store access), mirroring the same
// pattern JournalArticle uses.
export default function JournalCard({
    post,
    href,
    priority = false,
    sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
    post: BlogPost;
    href: string;
    priority?: boolean;
    sizes?: string;
}) {
    return (
        <Link href={href} className="group flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-ink/10">
                {post.image && (
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        priority={priority}
                        sizes={sizes}
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        unoptimized={typeof post.image === "string"}
                    />
                )}
            </div>
            <span className="mt-5 font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">{post.date}</span>
            <h3 className="mt-2 text-[19px] font-medium leading-snug text-ink transition group-hover:text-pink-dark">{post.title}</h3>
            <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-grey">{post.excerpt}</p>
        </Link>
    );
}
