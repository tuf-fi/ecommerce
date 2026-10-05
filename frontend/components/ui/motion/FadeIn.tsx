"use client";

import { motion } from "framer-motion";
import { BASE_DELAY, EASE, VIEWPORT, usePrefersReducedMotion } from "./constants";

export default function FadeIn({
    children,
    delay = 0,
    duration = 1,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}) {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ duration, delay: BASE_DELAY + delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
}
