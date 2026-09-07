"use client";

import Image from "next/image";
import { heroImage } from "../ui/images";
import { useStore } from "@/library/store";
import { HeroContent, useContent } from "@/library/content";
import FadeIn from "../ui/motion/FadeIn";

// `preview` renders inside the admin's live-preview pane, which now stacks
// full-width above the form (see ContentEditorShell) rather than sharing a
// column with it, so it can use a fixed height sized for that real width
// instead of guessing at a cramped, shared column's dimensions.
// `previewData` lets HeroEditor feed in its local unsaved draft instead of
// the live site's hero content — the admin needs to see keystrokes reflected
// here without those keystrokes going live before Save is clicked.
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
            <div className={preview ? "relative h-[520px]" : "relative -mx-8 w-[calc(100%+4rem)] h-screen"}>
                <Image src={hero.image ?? heroImage} alt="Cindyrella skincare products arranged for a daily routine" fill sizes="100vw" className="object-cover" priority={!preview} unoptimized={typeof hero.image === "string" && !!hero.image} />
                {/* Vignette, not a flat tint — keeps the top clear so the photo reads as
                    photography, darkens only where the copy needs contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

                <FadeIn className={`absolute bottom-20 left-0 w-full text-white ${preview ? "px-9" : "px-8"}`}>
                    <h1 className={preview ? "mt-3 text-[42px] leading-[1.05] font-normal" : "mt-3 font-normal"}>
                        {hero.headline}
                    </h1>
                    <p className={`text-white/80 ${preview ? "max-w-[480px]" : "max-w-[400px]"}`}>{hero.subtext}</p>

                    <div className="flex flex-row flex-wrap items-center gap-4 mt-8">
                        <button onClick={() => (preview ? undefined : scrollTo("bestsellers"))} className="group/cta flex items-center gap-2.5 bg-white px-6 py-4 text-ink text-[13.5px] font-semibold uppercase tracking-wide transition hover:bg-off">
                            {hero.cta}
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                        {!preview && (
                            <button onClick={() => openModal("quiz")} className="border border-white/40 px-6 py-4 text-[13.5px] font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10">
                                Find your Routine
                            </button>
                        )}
                    </div>
                </FadeIn>
            </div>
        </>
    );
}
