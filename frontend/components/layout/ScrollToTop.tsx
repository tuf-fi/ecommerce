"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll to top on route change; with a hash in the URL it scrolls to that section instead, retrying while the page lays out.
export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        const id = window.location.hash.slice(1);
        if (!id) {
            window.scrollTo(0, 0);
            return;
        }

        let tries = 0;
        const stop = () => clearInterval(timer);
        const timer = setInterval(() => {
            const el = document.getElementById(id);
            if (el && Math.abs(el.getBoundingClientRect().top - 120) > 6) el.scrollIntoView({ behavior: "auto" });
            if (++tries >= 12) stop();
        }, 120);

        // The visitor taking over the scroll cancels the retries.
        window.addEventListener("wheel", stop, { passive: true, once: true });
        window.addEventListener("touchmove", stop, { passive: true, once: true });
        return () => {
            stop();
            window.removeEventListener("wheel", stop);
            window.removeEventListener("touchmove", stop);
        };
    }, [pathname]);

    return null;
}
