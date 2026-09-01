"use client";

import { motion } from "framer-motion";
import { BASE_DELAY, EASE, SPRING, VIEWPORT } from "./constants";

export type Direction = "left" | "right" | "bottom" | "top";

const DISTANCE = 44;

const offset: Record<Direction, { x?: number; y?: number }> = {
    left: { x: -DISTANCE },
    right: { x: DISTANCE },
    bottom: { y: DISTANCE },
    top: { y: -DISTANCE },
};

export default function RevealIn({
    children,
    direction = "bottom",
    delay = 0,
    distance,
    duration = 0.7,
    className,
}: {
    children: React.ReactNode;
    direction?: Direction;
    delay?: number;
    distance?: number;
    duration?: number;
    className?: string;
}) {
    const base = offset[direction];
    const scaled = distance
        ? { x: base.x ? (base.x > 0 ? distance : -distance) : undefined, y: base.y ? (base.y > 0 ? distance : -distance) : undefined }
        : base;
    const start = BASE_DELAY + delay;

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, ...scaled }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={VIEWPORT}
            transition={{
                opacity: { duration, delay: start, ease: EASE },
                x: { ...SPRING, delay: start },
                y: { ...SPRING, delay: start },
            }}
        >
            {children}
        </motion.div>
    );
}
