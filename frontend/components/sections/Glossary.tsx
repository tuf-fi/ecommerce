"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { useContent } from "@/library/content";
import { PRODUCTS } from "@/library/products";

// No preview prop: edited via ConcernsTab's CRUD screen, not a ContentEditorShell editor, so there's no preview pane.
export default function Glossary(){
    const { concerns, sectionVisibility } = useContent();

    if (!sectionVisibility.glossary) return null;

    return(
        <SectionContainer id="concern">
            <SectionTitle section="glossary" title="Shop by Concern" />

            {/* Horizontally scrollable so the row holds up whether the CMS list has fewer or more tiles than a fixed grid. */}
            <div className="thin-scrollbar flex justify-center gap-4 overflow-x-auto pb-2">
                {concerns.map((concern, index) => {
                    const count = PRODUCTS.filter((p) => p.concerns?.includes(concern.key)).length;
                    return (
                        <RevealIn key={concern.id} direction="bottom" delay={index * 0.09} distance={28} className="flex-none">
                            {/* Overlaid caption matches the site's other photography-led tiles (Moments/Rituals, Journal). */}
                            <Link
                                href={`/shop?concern=${concern.key}`}
                                aria-label={`Shop for ${concern.title}`}
                                className="group relative flex aspect-[3/4] w-[160px] flex-none overflow-hidden border border-ink/10 sm:w-[190px]"
                            >
                                {concern.image && (
                                    <Image
                                        src={concern.image}
                                        alt=""
                                        fill
                                        sizes="190px"
                                        className="object-cover transition duration-500 group-hover:scale-105"
                                        unoptimized={typeof concern.image === "string"}
                                    />
                                )}
                                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-colors duration-300 group-hover:from-black/90" />
                                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 p-4 text-center">
                                    <span className="font-mono text-[11px] uppercase tracking-[.1em] text-white">{concern.title}</span>
                                    <span className="font-mono text-[10px] text-white/70">{count} product{count === 1 ? "" : "s"}</span>
                                </div>
                            </Link>
                        </RevealIn>
                    );
                })}
            </div>
        </SectionContainer>
    )
}
