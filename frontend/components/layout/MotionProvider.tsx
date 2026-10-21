"use client";

import { MotionConfig } from "framer-motion";

// Honours the visitor's "reduce motion" setting for every framer-motion reveal and transition in the app.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
