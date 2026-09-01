"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll to the top on every route change. Skipped when the URL
// carries a hash so navlink-driven section scrolling (Navbar's goToSection,
// including the cross-page "/#id" case) is left alone.
export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        if (window.location.hash) return;
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
