"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
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

// Quotation mark stays fixed while content slides; exit direction (left) vs enter (right) reads as a single-lane carousel, not a cross-fade.
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-10">
            <span aria-hidden className="flex-none font-display h-10 text-[56px] leading-none text-ink/15 sm:h-auto sm:text-[72px]">
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
                            <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-blue-accent font-mono text-[12px] text-white">
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
    const { testimonials, sectionVisibility } = useContent();

    if (!sectionVisibility.testimonials) return null;
    if (testimonials.length === 0) return null;

    return (
        <SectionContainer id="testimonials">
            <SectionTitle section="testimonials" title="Testimonials" />

            <FeaturedTestimonial pool={testimonials} />
        </SectionContainer>
    );
}
