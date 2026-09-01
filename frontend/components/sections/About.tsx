import SectionTitle from "../ui/SectionTitle";
import SectionContainer from "../ui/Section";
import FadeIn from "../ui/motion/FadeIn";
import TypeReveal from "../ui/motion/TypeReveal";

export default function AboutSection(){
    return(
        <SectionContainer tint="pink-soft" id="about">
            <SectionTitle num="01" title="About" />

            <div className="flex flex-row gap-x-20">
                <FadeIn delay={0.1} className="left-info flex flex-col gap-y-7">
                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Founder</span>
                        <span className="text-[13px]">2026</span>
                    </div>

                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Location</span>
                        <span className="text-[13px]">Metro Manila, PH</span>
                    </div>

                    <div className="info flex flex-col">
                        <span className="text-[10px] uppercase tracking-[.16em] text-grey">Focus</span>
                        <span className="text-[13px]">Considered skincare, formulated in small batches</span>
                    </div>
                </FadeIn>

                <div className="right-info w-[98%] text-[clamp(20px,2.3vw,28px)] flex-shrink-1">
                    <TypeReveal
                        segments={[
                            { text: "A studio built on restraint.", className: "italic pink-highlight" },
                            { text: " Cindyrella is a considered skincare studio based in Metro Manila, built on the idea that a routine should be simple, effective, and honest about what's in it. We formulate in small batches, around fewer and better ingredients, and we'd rather make five products we believe in than fifty we don't." },
                        ]}
                    />
                </div>
            </div>
        </SectionContainer>
    );
};