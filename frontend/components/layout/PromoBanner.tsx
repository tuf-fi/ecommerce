"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useContent } from "@/library/content";
import { Promo } from "@/library/admin/types";

const DISMISS_KEY_PREFIX = "cindyrella_promo_dismissed_";
// Fixed, deterministic banner height (matches the `h-10` class below) — kept
// as a constant rather than measured via offsetHeight so `app/layout.tsx` can
// pre-set `--promo-h` for the server-rendered first paint (which can't run
// JS to measure anything), and hydration never has to correct a wrong guess.
const PROMO_BANNER_HEIGHT = "2.5rem";

// Two call shapes: with a `promo` prop (the admin preview pane, showing a
// specific draft — possibly unsaved, possibly not the live-active one — so
// it's never dismissible), or with no prop at all (the real site banner,
// which looks up whichever promo is currently active and can be dismissed
// for the session).
export default function PromoBanner({ promo: previewPromo }: { promo?: Promo } = {}) {
    const { promos } = useContent();
    const isPreview = previewPromo !== undefined;
    const livePromo = promos.find((p) => p.active) ?? null;
    const promo = isPreview ? previewPromo : livePromo;

    const [dismissed, setDismissed] = useState(false);

    // One-time read of a browser-only API at mount to hydrate session-scoped
    // dismissal — there's no way to know this before the client mounts, so
    // this can't be expressed as a derived/lazy-initial value.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (isPreview || !promo) return;
        setDismissed(sessionStorage.getItem(DISMISS_KEY_PREFIX + promo.id) === "1");
    }, [isPreview, promo]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const visible = !isPreview && !!promo && promo.active && !dismissed;

    // The real banner is fixed at the top of the viewport; write its (fixed,
    // known-ahead-of-time) height to a CSS var so Navbar (a sibling, not a
    // parent, under app/layout.tsx) can shift itself down by exactly that
    // amount without the two components sharing React state.
    // `app/layout.tsx` seeds this same var from the static default promo
    // data for the server-rendered first paint — this effect only needs to
    // correct it afterwards for client-only state (session dismissal, or an
    // admin edit changing which promo is active). Preview mode (admin pane)
    // never drives this var — it renders in-flow in a small preview box, not
    // the real page, and must never affect the real fixed navbar.
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
