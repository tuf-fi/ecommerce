"use client";

import SectionTitle from "../ui/SectionTitle";
import SectionContainer from "../ui/Section";
import FadeIn from "../ui/motion/FadeIn";
import TypeReveal from "../ui/motion/TypeReveal";
import { AboutContent, useContent } from "@/library/content";

// preview mode drops the scroll-anchor id and full-bleed margin; previewData carries the editor's unsaved draft.
export default function AboutSection({
    preview = false,
    previewData,
}: { preview?: boolean; previewData?: AboutContent } = {}) {
    const { about: liveAbout, sectionVisibility } = useContent();
    const about = previewData ?? liveAbout;

    if (!preview && !sectionVisibility.about) return null;

    return (
        <SectionContainer id={preview ? undefined : "about"} preview={preview}>
            <SectionTitle section="about" title="About" />

            <div className="flex flex-col gap-y-10 lg:flex-row lg:gap-x-20">
                <FadeIn delay={0.1} className="left-info grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:flex lg:flex-none lg:flex-col">
                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Founder</span>
                        <span className="text-[13px]">{about.founder}</span>
                    </div>

                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Location</span>
                        <span className="text-[13px]">{about.location}</span>
                    </div>

                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Focus</span>
                        <span className="text-[13px]">{about.focus}</span>
                    </div>
                </FadeIn>

                <div className="right-info min-w-0 flex-1 text-[clamp(20px,2.3vw,28px)]">
                    <TypeReveal
                        segments={[
                            { text: about.lead, className: "italic pink-highlight" },
                            { text: ` ${about.body}` },
                        ]}
                    />
                </div>
            </div>
        </SectionContainer>
    );
}
