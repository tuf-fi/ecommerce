"use client";

import { useSyncExternalStore } from "react";

// Shared pacing so every scroll reveal feels like one system, not each section improvising its own timing.
export const EASE = [0.16, 1, 0.3, 1] as const;

// Base delay before any reveal starts, giving the section a beat to settle without reading as late.
export const BASE_DELAY = 0.08;

// Default spacing between items in a staggered group.
export const STAGGER = 0.14;

// margin shrinks the viewport's bottom edge so a section counts as "in view" only once actually visible, not while still off-screen.
export const VIEWPORT = { once: true, amount: 0.05, margin: "0px 0px -80px 0px" } as const;

// Critically-damped-ish spring for the transform half of a reveal, for a natural glide instead of a mechanical slide.
export const SPRING = { type: "spring", stiffness: 60, damping: 20, mass: 1 } as const;

function subscribeToReducedMotion(callback: () => void) {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
    return false;
}

// Shared reduced-motion check (WCAG 2.3.3) via useSyncExternalStore, so every reveal component skips animation consistently and stays in sync with the OS setting.
export function usePrefersReducedMotion() {
    return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}
