"use client";

import Image from "next/image";
import { heroImage } from "../ui/images";
import { useStore } from "@/library/store";
import { HeroContent, useContent } from "@/library/content";
import FadeIn from "../ui/motion/FadeIn";

// preview mode uses a fixed height sized for the full-width preview pane; previewData carries the editor's unsaved draft.
export default function Hero({
    preview = false,
    previewData,
}: { preview?: boolean; previewData?: HeroContent } = {}) {
    const { openModal } = useStore();
    const { hero: liveHero, sectionVisibility } = useContent();
    const hero = previewData ?? liveHero;

    function scrollTo(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }

    if (!preview && !sectionVisibility.hero) return null;

    return (
        <>
            <div className={preview ? "relative h-[520px]" : "relative -mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] h-svh min-h-[580px] max-h-[1200px]"}>
                <Image src={hero.image ?? heroImage} alt="Cindyrella skincare products arranged for a daily routine" fill sizes="100vw" className="object-cover" priority={!preview} unoptimized={typeof hero.image === "string" && !!hero.image} />
                {/* Vignette, not a flat tint — keeps the top clear so the photo reads as
                    photography, darkens only where the copy needs contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

                <FadeIn className={`absolute left-0 w-full text-white ${preview ? "bottom-20 px-9" : "bottom-12 px-(--gutter) sm:bottom-16 lg:bottom-20"}`}>
                    <h1 className={preview ? "mt-3 text-[42px] leading-[1.05] font-normal" : "mt-3 font-normal"}>
                        {hero.headline}
                    </h1>
                    <p className={`text-white/80 ${preview ? "max-w-[480px]" : "max-w-[400px]"}`}>{hero.subtext}</p>

                    <div className="flex flex-col items-stretch gap-3 mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:mt-8">
                        <button onClick={() => (preview ? undefined : scrollTo("bestsellers"))} className="group/cta flex items-center justify-center gap-2.5 bg-white px-6 py-4 text-ink text-[13.5px] font-semibold uppercase tracking-wide transition hover:bg-off">
                            {hero.cta}
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                        {!preview && (
                            <button onClick={() => openModal("quiz")} className="border border-white/40 px-6 py-4 text-center text-[13.5px] font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10">
                                Find your Routine
                            </button>
                        )}
                    </div>
                </FadeIn>
            </div>
        </>
    );
}
