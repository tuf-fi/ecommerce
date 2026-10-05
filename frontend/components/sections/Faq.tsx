"use client";

import * as Accordion from "@radix-ui/react-accordion";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import FadeIn from "../ui/motion/FadeIn";
import RevealIn from "../ui/motion/RevealIn";
import { useContent } from "@/library/content";

function FaqAccordion({ compact }: { compact: boolean }) {
    const { faqs } = useContent();
    return (
        <Accordion.Root type="single" collapsible className={`mt-2 flex flex-col divide-y divide-ink/10 border-t border-ink/10 ${compact ? "" : "-ml-32"}`}>
            {faqs.map((item, index) => (
                <RevealIn key={item.id} direction="bottom" delay={index * 0.1} distance={20}>
                    <Accordion.Item value={String(item.id)} className="py-5">
                        <Accordion.Header>
                            <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-6 text-left text-[15px] font-medium text-ink transition-colors hover:text-pink-dark">
                                {item.q}
                                <span className="flex-none font-mono text-lg text-grey transition-all duration-300 ease-in-out group-hover:text-pink-dark group-data-[state=open]:rotate-45 group-data-[state=open]:text-pink-dark">+</span>
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <p className="mt-3 max-w-[460px] text-[13.5px] leading-relaxed text-grey">{item.a}</p>
                        </Accordion.Content>
                    </Accordion.Item>
                </RevealIn>
            ))}
        </Accordion.Root>
    );
}

// preview mode stacks to one column and skips the tinted background, since the real two-column layout assumes full page width.
export default function Faqs({ preview = false }: { preview?: boolean } = {}) {
    const { sectionVisibility } = useContent();

    if (preview) {
        return <FaqAccordion compact />;
    }

    if (!sectionVisibility.faq) return null;

    return(
        <SectionContainer id="faq">
            <SectionTitle num="07" title="FAQ" />

            <div className="grid grid-cols-[.9fr_1.1fr] gap-14">
                <FadeIn>
                    <h2 className="mb-4 text-[clamp(26px,3vw,38px)] font-medium text-ink">
                        <em className="pink-highlight">Answers,</em>
                        <br />
                        before you ask.
                    </h2>
                    <p className="mb-6 max-w-[320px] text-[13.5px] text-grey">Can&apos;t find what you&apos;re looking for? We&apos;re happy to help directly.</p>
                    <a href="#contact" className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-pink-dark underline decoration-pink-dark/40 underline-offset-4 transition-colors hover:decoration-pink-dark">
                        Get in touch →
                    </a>
                </FadeIn>

                <FaqAccordion compact={false} />
            </div>
        </SectionContainer>
    )
}
