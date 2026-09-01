"use client";

import { useEffect } from "react";

// Scrolls to the top of the viewport whenever `value` changes — for same-page
// state transitions (e.g. pagination) that ScrollToTop's route-change reset
// never sees, since they don't touch the pathname.
export function useScrollTopOnChange(value: unknown) {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [value]);
}
