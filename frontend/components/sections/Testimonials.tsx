"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { EASE } from "../ui/motion/constants";
import { useContent } from "@/library/content";
import { Testimonial } from "@/library/admin/types";

const ROTATE_INTERVAL_MS = 7000;
const SLIDE_DISTANCE = 48;

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

// The quotation mark is a fixed, non-animated anchor for the whole block —
// only the message/avatar/name beneath it slide on rotation, per the
// explicit note that the quote itself should stay in place while the
// testimonial content changes. Direction is deliberate: the outgoing
// testimonial exits toward the left while the incoming one enters from the
// right, like a single-lane carousel rather than a plain cross-fade.
function FeaturedTestimonial({ pool }: { pool: Testimonial[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (pool.length <= 1) return;
        const timer = setInterval(() => setIndex((i) => (i + 1) % pool.length), ROTATE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [pool.length]);

    const featured = pool[Math.min(index, pool.length - 1)];
    if (!featured) return null;

    return (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <span aria-hidden className="flex-none font-display text-[72px] leading-none text-ink/15">
                “
            </span>
            <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={featured.id}
                        initial={{ opacity: 0, x: SLIDE_DISTANCE }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -SLIDE_DISTANCE }}
                        transition={{ duration: 0.6, ease: EASE }}
                    >
                        <p className="mb-7 max-w-[720px] text-[21px] leading-relaxed text-ink sm:text-[26px]">{featured.message}</p>
                        <div className="flex items-center gap-3.5">
                            <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-navy font-mono text-[12px] text-white">
                                {featured.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={featured.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    initials(featured.name)
                                )}
                            </span>
                            <div>
                                <p className="text-[14px] font-medium text-ink">{featured.name}</p>
                                <p className="font-mono text-[11px] uppercase tracking-[.08em] text-grey">
                                    {featured.position}, {featured.company}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function Testimonials() {
    const { testimonials } = useContent();

    if (testimonials.length === 0) return null;

    return (
        <SectionContainer tint="blue-soft" id="testimonials">
            <SectionTitle num="08" title="Testimonials" />

            <RevealIn direction="bottom">
                <FeaturedTestimonial pool={testimonials} />
            </RevealIn>
        </SectionContainer>
    );
}
