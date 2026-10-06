"use client";

import { motion } from "framer-motion";
import { BASE_DELAY, EASE, VIEWPORT } from "./motion/constants";
import { useContent } from "@/library/content";
import { SECTION_KEYS, SectionKey } from "@/library/admin/sections";

// Hero, Philosophy and Newsletter carry no index label, so they don't count.
const UNNUMBERED: SectionKey[] = ["hero", "philosophy", "newsletter"];

// Pass `section` on the homepage to number by visible position; `num` is the fixed label for standalone pages.
export default function SectionTitle({ num, section, title, action }: { num?: string; section?: SectionKey; title: string; action?: React.ReactNode }) {
    const { sectionVisibility } = useContent();
    const label = section
        ? String(SECTION_KEYS.filter((k) => !UNNUMBERED.includes(k) && (k === section || sectionVisibility[k])).indexOf(section) + 1).padStart(2, "0")
        : num;

    return (
        <div className="flex flex-row items-center gap-x-5 uppercase mb-11">
            <span className="font-mono text-[10.5px] text-grey">{label}</span>
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
