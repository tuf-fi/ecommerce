"use client";

import { motion } from "framer-motion";
import { BASE_DELAY, EASE, VIEWPORT } from "./motion/constants";

export default function SectionTitle({ num, title, action }: { num: string; title: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-row items-center gap-x-5 uppercase mb-11">
            <span className="font-mono text-[10.5px] text-grey">{num}</span>
            <span className="font-mono text-[10.5px] tracking-[.16em] text-ink">{title}</span>
            <motion.span
                className="h-px flex-1 origin-left bg-gradient-to-r from-grey-light to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.9, delay: BASE_DELAY, ease: EASE }}
            ></motion.span>
            {action}
        </div>
    );
};
