// Shared pacing so every scroll reveal across the landing page feels like
// one system rather than each section improvising its own timing.
export const EASE = [0.16, 1, 0.3, 1] as const;

// Base delay before any reveal starts, on top of the viewport trigger —
// gives the section a beat to settle before it animates, without reading as late.
export const BASE_DELAY = 0.08;

// Default spacing between items in a staggered group.
export const STAGGER = 0.14;

// `margin` extends the viewport downward so a section is considered "in
// view" while it's still partly below the fold — reveals start as it
// approaches rather than after it's already centered on screen.
export const VIEWPORT = { once: true, amount: 0.05, margin: "0px 0px 200px 0px" } as const;

// Critically-damped-ish spring for the transform half of a reveal — reads as
// a natural glide rather than a mechanical linear/eased slide.
export const SPRING = { type: "spring", stiffness: 60, damping: 20, mass: 1 } as const;
