"use client";

// The fixed bottom bar shared by the cart and checkout pages. `inFlow` (admin preview) keeps it in the page flow, since a
// real `position: fixed` bar would escape the preview column.
export default function ActionBar({ children, inFlow = false }: { children: React.ReactNode; inFlow?: boolean }) {
    return (
        <div
            className={
                inFlow
                    ? "mt-10 border border-ink/10 bg-white"
                    : "fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white shadow-[0_-10px_28px_rgba(18,35,58,.07)]"
            }
        >
            <div className="flex items-center gap-3 px-[var(--gutter)] py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:gap-5">{children}</div>
        </div>
    );
}

// Total on one line, with shipping and what was saved in a single small line beneath it.
// `shipping`: a number, or null while it's still being worked out; leave it undefined to hide the line.
export function BarTotal({ amount, saved = 0, shipping, note }: { amount: number; saved?: number; shipping?: number | null; note?: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <div className="flex items-baseline gap-2 leading-none">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">Total</span>
                <span className="font-mono text-[16px] font-semibold text-ink sm:text-[18px]">₱{amount.toLocaleString()}</span>
            </div>
            {(shipping !== undefined || saved > 0) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[10.5px] leading-none text-grey">
                    {shipping !== undefined && <span>Shipping {shipping === null ? "—" : shipping > 0 ? `₱${shipping.toLocaleString()}` : "Free"}</span>}
                    {saved > 0 && <span className="text-success-dark">Saved ₱{saved.toLocaleString()}</span>}
                </div>
            )}
            {note && <div className="mt-1.5 hidden max-w-[320px] text-[11px] leading-snug text-grey sm:block">{note}</div>}
        </div>
    );
}

export const BAR_BUTTON =
    "group inline-flex h-11 flex-none items-center justify-center gap-2 bg-navy px-4 text-[12px] font-semibold tracking-[.06em] whitespace-nowrap text-white uppercase transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:bg-off disabled:text-grey disabled:hover:bg-off sm:px-6";

export function BarArrow() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-enabled:group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}
