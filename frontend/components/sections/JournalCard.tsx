import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/library/admin/types";

// Shared card markup for /journal's grid and "More from the Journal"; pure/presentational, mirroring JournalArticle's pattern.
export default function JournalCard({
    post,
    href,
    priority = false,
    sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
    size = "default",
}: {
    post: BlogPost;
    href: string;
    priority?: boolean;
    sizes?: string;
    // Opt-in larger variant (16/9 image, bigger type) for the one card meant to stand out; mirrors Card.tsx's size="large".
    size?: "default" | "large";
}) {
    const large = size === "large";

    return (
        <Link href={href} className="group flex flex-col">
            <div
                className={`relative w-full overflow-hidden border border-ink/10 transition-colors duration-300 group-hover:border-ink/30 ${
                    large ? "aspect-[16/9]" : "aspect-[4/3]"
                }`}
            >
                {post.image && (
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        priority={priority}
                        sizes={large ? "(min-width: 640px) 66vw, 100vw" : sizes}
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        unoptimized={typeof post.image === "string"}
                    />
                )}
            </div>
            <span className={`font-mono uppercase tracking-[.16em] text-grey ${large ? "mt-6 text-[11px]" : "mt-5 text-[10.5px]"}`}>
                {post.date}
            </span>
            <h3
                className={`font-medium leading-snug text-ink transition group-hover:text-pink-dark ${
                    large ? "mt-2.5 text-[24px] sm:text-[28px]" : "mt-2 text-[19px]"
                }`}
            >
                {post.title}
            </h3>
            <p className={`leading-relaxed text-grey ${large ? "mt-3 max-w-[520px] text-[14.5px] line-clamp-2" : "mt-2.5 text-[13.5px] line-clamp-2"}`}>
                {post.excerpt}
            </p>
        </Link>
    );
}
