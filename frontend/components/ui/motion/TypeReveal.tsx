"use client";

import { motion, type Variants } from "framer-motion";
import { BASE_DELAY, VIEWPORT, usePrefersReducedMotion } from "./constants";

export type TypeSegment = { text: string; className?: string };

const container: Variants = {
    hidden: {},
    visible: (speed: number) => ({
        transition: { staggerChildren: speed, delayChildren: BASE_DELAY },
    }),
};

const char: Variants = {
    hidden: { opacity: 0, y: 3 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.1, ease: "easeOut" } },
};

// Splits into words (so lines wrap normally) then characters, staggering reveals so several letters are mid-fade at once — a cascade, not a flicker.
export default function TypeReveal({
    segments,
    speed = 0.005,
    className,
}: {
    segments: TypeSegment[];
    speed?: number;
    className?: string;
}) {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
        return (
            <p className={className}>
                {segments.map((seg, si) => (
                    <span key={si} className={seg.className}>
                        {seg.text}
                    </span>
                ))}
            </p>
        );
    }

    return (
        <motion.p
            className={className}
            variants={container}
            custom={speed}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
        >
            {segments.map((seg, si) =>
                seg.text.split(/(\s+)/).map((chunk, ci) => {
                    if (chunk === "") return null;
                    if (/^\s+$/.test(chunk)) {
                        return <span key={`${si}-${ci}`}>{chunk}</span>;
                    }
                    return (
                        <span key={`${si}-${ci}`} className={`inline-block whitespace-nowrap ${seg.className ?? ""}`}>
                            {chunk.split("").map((ch, chi) => (
                                <motion.span key={chi} variants={char} className="inline-block">
                                    {ch}
                                </motion.span>
                            ))}
                        </span>
                    );
                })
            )}
        </motion.p>
    );
}
