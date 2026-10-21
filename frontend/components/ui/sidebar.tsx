import Skeleton from "@/components/ui/Skeleton";

// Shared look for the pinned side columns on Shop, Wishlist and Cart: a bordered column under the navbar,
// shaped like the account sidebar, whose contents stay in place while the page beside it scrolls.

const MIN_H = "min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))]";

export const SHELL_GRID = `grid grid-cols-1 border-t border-ink/10 ${MIN_H} lg:grid-cols-[260px_1fr]`;
export const SHELL_GRID_RIGHT = `grid grid-cols-1 border-t border-ink/10 ${MIN_H} lg:grid-cols-[1fr_340px]`;
export const SHELL_WRAPPER = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white pt-[var(--navbar-h,68px)]";
export const PAGE_COLUMN = "min-w-0 px-[var(--gutter)] pt-[1.2rem] pb-20 sm:px-8 lg:px-10";

export const ASIDE_CLASS = "relative z-10 hidden min-w-0 border-r border-ink/10 bg-white lg:block";
export const ASIDE_CLASS_RIGHT = "relative z-10 hidden min-w-0 border-l border-ink/10 bg-white lg:block";
export const ASIDE_STICKY =
    "thin-scrollbar overflow-x-hidden px-6 pt-[1.2rem] pb-6 lg:sticky lg:top-[calc(var(--navbar-h,68px)+var(--promo-h,0px))] lg:max-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] lg:overflow-y-auto";
// Same, leaving room for the fixed checkout bar along the bottom of the cart.
export const ASIDE_STICKY_ABOVE_BAR =
    "thin-scrollbar overflow-x-hidden px-6 pt-[1.2rem] pb-6 lg:sticky lg:top-[calc(var(--navbar-h,68px)+var(--promo-h,0px))] lg:max-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px)-4.5rem)] lg:overflow-y-auto";

export const SECTION_LABEL = "mb-1 block px-3 font-mono text-label uppercase tracking-[.16em] text-grey";
// Lines up with the page intro's label in the column beside it.
export const HEADER_ROW = "flex min-h-11 items-center justify-between gap-3";
export const HEADER_LABEL = "font-mono text-label uppercase tracking-[.16em] text-grey";

export const rowClass = (active: boolean) =>
    `flex w-full items-center justify-between gap-3 border-l-2 py-2 pr-2.5 pl-3 text-left text-meta transition ${
        active ? "border-pink-btn bg-pink-soft/50 font-semibold text-pink-dark" : "border-transparent text-grey hover:border-ink/15 hover:bg-off/70 hover:text-ink"
    }`;

export function Tick() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

// Loading stand-in for the filter column: a header row, the search box, then groups of rows (the last group carries counts).
export function FilterColumnSkeleton({ groups }: { groups: number[] }) {
    return (
        <div className="hidden border-r border-ink/10 px-6 pt-[1.2rem] pb-6 lg:block">
            <div className="flex min-h-11 items-center">
                <Skeleton tone="faint" className="h-[10.5px] w-14" />
            </div>
            <Skeleton tone="outline" className="mt-6 mb-6 h-11 w-full" />
            {groups.map((count, g) => (
                <div key={g} className="mb-6">
                    <Skeleton tone="faint" className="mb-2 ml-3 h-[10px] w-14" />
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="flex h-[35px] items-center justify-between gap-3 pr-2.5 pl-3">
                            <Skeleton tone="soft" className="h-3 w-24" />
                            {g === groups.length - 1 && <Skeleton tone="soft" className="h-[11px] w-4" />}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
