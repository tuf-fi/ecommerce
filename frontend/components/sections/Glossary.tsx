"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { useContent } from "@/library/content";
import { PRODUCTS } from "@/library/products";

// No `preview` prop: this section is edited through ConcernsTab's CRUD screen
// (see the dispatcher in admin/content/pages/[slug]) rather than a
// ContentEditorShell editor, so there's no live-preview pane to render into.
export default function Glossary(){
    const { concerns, sectionVisibility } = useContent();

    if (!sectionVisibility.glossary) return null;

    return(
        <SectionContainer tint="pink-soft" id="concern">
            <SectionTitle num="04" title="Shop by Concern" />

            {/* Horizontally scrollable instead of a fixed grid so the row holds
                up whether the CMS-managed list has fewer tiles (no dangling
                empty grid tracks) or more (scrolls instead of wrapping into an
                uneven second row). */}
            <div className="thin-scrollbar flex gap-4 overflow-x-auto pb-2">
                {concerns.map((concern, index) => {
                    const count = PRODUCTS.filter((p) => p.concerns?.includes(concern.key)).length;
                    return (
                        <RevealIn key={concern.id} direction="bottom" delay={index * 0.09} distance={28} className="flex-none">
                            <Link href={`/shop?concern=${concern.key}`} aria-label={`Shop for ${concern.title}`} className="group flex w-[150px] flex-col gap-3 sm:w-[170px]">
                                <div className="relative aspect-[3/4] w-full overflow-hidden border border-ink/10">
                                    {concern.image && (
                                        <Image
                                            src={concern.image}
                                            alt=""
                                            fill
                                            sizes="170px"
                                            className="object-cover transition duration-500 group-hover:scale-105"
                                            unoptimized={typeof concern.image === "string"}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-center font-mono text-[11px] uppercase tracking-[.1em] text-ink">{concern.title}</span>
                                    <span className="text-center font-mono text-[10px] text-grey">{count} product{count === 1 ? "" : "s"}</span>
                                </div>
                            </Link>
                        </RevealIn>
                    );
                })}
            </div>
        </SectionContainer>
    )
}
