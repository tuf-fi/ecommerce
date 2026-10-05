"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { STAGGER } from "../ui/motion/constants";
import { useContent } from "@/library/content";

// No preview prop: edited via RitualsTab's CRUD screen, not a ContentEditorShell editor, so there's no preview pane.
export default function Moments(){
    const { rituals, sectionVisibility } = useContent();

    if (!sectionVisibility.moments) return null;

    return(
        <SectionContainer id="rituals">
            <SectionTitle num="03" title="Rituals" />

            <div className="grid grid-cols-2 gap-6">
                {rituals.map((ritual, index) => (
                    <RevealIn key={ritual.id} direction="bottom" delay={index * STAGGER}>
                        <Link
                            href={`/rituals/${ritual.id}`}
                            className="group relative isolate flex h-[440px] flex-col justify-end overflow-hidden border border-ink/10 p-9"
                        >
                            {ritual.image && (
                                <Image
                                    src={ritual.image}
                                    alt={ritual.title}
                                    fill
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                    className="absolute inset-0 -z-10 object-cover transition duration-500 group-hover:scale-[1.04]"
                                    unoptimized={typeof ritual.image === "string"}
                                />
                            )}
                            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                            <span className="eyebrow mb-3 text-white/70">
                                {ritual.eyebrow}
                            </span>
                            <h3 className="mb-2 text-[clamp(22px,2.4vw,30px)] font-medium text-white">
                                {ritual.title}
                            </h3>
                            <p className="mb-5 max-w-[320px] text-[13.5px] leading-relaxed text-white/80">
                                {ritual.copy}
                            </p>
                            <span className="inline-flex w-fit items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                                Shop Now →
                            </span>
                        </Link>
                    </RevealIn>
                ))}
            </div>
        </SectionContainer>
    )
}
