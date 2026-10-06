"use client";

import Image from "next/image";
import SectionContainer from "../ui/Section";
import { philosophyImage } from "../ui/images";
import { PhilosophyContent, useContent } from "@/library/content";

// preview mode drops the full-bleed margin, scroll-anchor id, and visibility guard (admin needs to see hidden sections); previewData carries the editor's unsaved draft.
export default function Philosophy({
    preview = false,
    previewData,
}: { preview?: boolean; previewData?: PhilosophyContent } = {}) {
    const { philosophy: livePhilosophy, sectionVisibility } = useContent();
    const philosophy = previewData ?? livePhilosophy;

    if (!preview && !sectionVisibility.philosophy) return null;

    return (
        <SectionContainer id={preview ? undefined : "philosophy"} preview={preview}>
            <div className={`relative flex overflow-hidden bg-navy ${preview ? "" : "-mx-8 w-[calc(100%+4rem)]"}`}>
                <div className="relative hidden w-[45%] flex-shrink-0 overflow-hidden sm:block">
                    <Image src={philosophyImage} alt="Philosophy" fill sizes="45vw" className="object-cover" />
                    <div aria-hidden className="pointer-events-none absolute -top-[100px] -left-[80px] h-[280px] w-[280px] rounded-full bg-pink opacity-14 blur-[70px]" />
                </div>

                <div className="philosophy-text flex w-full flex-col justify-center gap-y-8 p-16 sm:w-[55%]">
                    <span className="eyebrow">{philosophy.eyebrow}</span>

                    <p className="philosophy text-white text-[clamp(24px,2.6vw,36px)]">{philosophy.headline}</p>
                    <p className="philosophy-subText max-w-[440px] text-grey-light">{philosophy.subtext}</p>
                </div>
            </div>
        </SectionContainer>
    );
}
