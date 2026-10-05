"use client";

import { useEffect } from "react";

// For same-page transitions (e.g. pagination) that ScrollToTop's route-change reset never sees.
// `enabled: false` for a page rendered outside its real route (e.g. embedded in the admin's live-preview pane) —
// scrolling the whole window from inside a small preview box would yank the admin's own scroll position around.
export function useScrollTopOnChange(value: unknown, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [value, enabled]);
}
