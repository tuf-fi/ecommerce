// Shared pacing so every scroll reveal across the landing page feels like
// one system rather than each section improvising its own timing.
export const EASE = [0.16, 1, 0.3, 1] as const;

// Base delay before any reveal starts, on top of the viewport trigger —
// gives the section a beat to settle before it animates, without reading as late.
export const BASE_DELAY = 0.08;

// Default spacing between items in a staggered group.
export const STAGGER = 0.14;

// `margin` shrinks the viewport's bottom edge upward so a section only
// counts as "in view" once it's actually visible on screen — reveals
// trigger as the section arrives rather than while it's still off-screen,
// so a slow scroll can actually see the animation play out.
export const VIEWPORT = { once: true, amount: 0.05, margin: "0px 0px -80px 0px" } as const;

// Critically-damped-ish spring for the transform half of a reveal — reads as
// a natural glide rather than a mechanical linear/eased slide.
export const SPRING = { type: "spring", stiffness: 60, damping: 20, mass: 1 } as const;
