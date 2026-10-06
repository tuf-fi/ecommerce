"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll to top on route change; skipped when the URL carries a hash so navlink-driven section scrolling is left alone.
export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        if (window.location.hash) return;
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
