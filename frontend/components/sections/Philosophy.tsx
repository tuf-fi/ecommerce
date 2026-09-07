"use client";

import Image from "next/image";
import SectionContainer from "../ui/Section";
import FadeIn from "../ui/motion/FadeIn";
import { philosophyImage } from "../ui/images";
import { PhilosophyContent, useContent } from "@/library/content";

// `preview` renders inside the admin's live-preview pane — same component as
// the real homepage section (see Hero.tsx for the pattern), just dropping the
// full-bleed negative margin, which has nothing to bleed against inside the
// preview pane, and skipping both the scroll-anchor id and the visibility
// guard (an admin editing a switched-off section still needs to see it).
// `previewData` lets PhilosophyEditor feed in its local unsaved draft — see Hero.tsx.
export default function Philosophy({
    preview = false,
    previewData,
}: { preview?: boolean; previewData?: PhilosophyContent } = {}) {
    const { philosophy: livePhilosophy, sectionVisibility } = useContent();
    const philosophy = previewData ?? livePhilosophy;

    if (!preview && !sectionVisibility.philosophy) return null;

    return (
        <SectionContainer id={preview ? undefined : "philosophy"}>
            <FadeIn className={`relative flex overflow-hidden bg-navy ${preview ? "" : "-mx-8 w-[calc(100%+4rem)]"}`}>
                <div className="relative hidden w-[45%] flex-shrink-0 overflow-hidden sm:block">
                    <Image src={philosophyImage} alt="Philosophy" fill sizes="45vw" className="object-cover" />
                    <div aria-hidden className="pointer-events-none absolute -top-[100px] -left-[80px] h-[280px] w-[280px] rounded-full bg-pink opacity-14 blur-[70px]" />
                </div>

                <div className="philosophy-text flex w-full flex-col justify-center gap-y-8 p-16 sm:w-[55%]">
                    <span className="eyebrow">{philosophy.eyebrow}</span>

                    <p className="philosophy text-white text-[clamp(24px,2.6vw,36px)]">{philosophy.headline}</p>
                    <p className="philosophy-subText max-w-[440px] text-grey-light">{philosophy.subtext}</p>
                </div>
            </FadeIn>
        </SectionContainer>
    );
}
