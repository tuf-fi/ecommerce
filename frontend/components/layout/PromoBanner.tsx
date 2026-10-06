"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useContent } from "@/library/content";
import { Promo } from "@/library/admin/types";

const DISMISS_KEY_PREFIX = "cindyrella_promo_dismissed_";
// Kept as a constant (matches `h-10`) rather than measured, so app/layout.tsx can pre-set `--promo-h` for server-rendered first paint.
const PROMO_BANNER_HEIGHT = "2.5rem";

// With a `promo` prop: admin preview pane, never dismissible. With none: the real site banner, looks up the active promo.
export default function PromoBanner({ promo: previewPromo }: { promo?: Promo } = {}) {
    const { promos } = useContent();
    const isPreview = previewPromo !== undefined;
    const livePromo = promos.find((p) => p.active) ?? null;
    const promo = isPreview ? previewPromo : livePromo;

    const [dismissed, setDismissed] = useState(false);

    // One-time read of sessionStorage at mount — unknowable before the client mounts, so can't be a derived/lazy-initial value.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (isPreview || !promo) return;
        setDismissed(sessionStorage.getItem(DISMISS_KEY_PREFIX + promo.id) === "1");
    }, [isPreview, promo]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const visible = !isPreview && !!promo && promo.active && !dismissed;

    // Writes height to `--promo-h` so sibling Navbar can shift down without shared React state; preview mode never touches this var.
    useLayoutEffect(() => {
        if (isPreview) return;
        const root = document.documentElement;
        root.style.setProperty("--promo-h", visible ? PROMO_BANNER_HEIGHT : "0px");
        return () => {
            root.style.setProperty("--promo-h", "0px");
        };
    }, [isPreview, visible]);

    if (!promo || !promo.active || (!isPreview && dismissed)) return null;

    return (
        <div
            className={`flex h-10 items-center justify-center gap-2 bg-pink-btn px-8 text-center text-[12.5px] text-white ${
                isPreview ? "relative" : "fixed top-0 inset-x-0 z-[51]"
            }`}
        >
            <span>
                {promo.text}
                {promo.code && (
                    <>
                        {" "}
                        — code <b className="font-mono tracking-[.06em]">{promo.code}</b>
                    </>
                )}
            </span>
            {!isPreview && (
                <button
                    aria-label="Dismiss"
                    onClick={() => {
                        sessionStorage.setItem(DISMISS_KEY_PREFIX + promo.id, "1");
                        setDismissed(true);
                    }}
                    className="absolute right-5 text-white/60 transition hover:text-white"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>
            )}
        </div>
    );
}
