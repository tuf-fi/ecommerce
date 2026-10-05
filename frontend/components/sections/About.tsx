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
            <SectionTitle num="01" title="About" />

            <div className="flex flex-row gap-x-20">
                <FadeIn delay={0.1} className="left-info flex flex-col gap-y-7">
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

                <div className="right-info w-[98%] text-[clamp(20px,2.3vw,28px)] flex-shrink-1">
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
