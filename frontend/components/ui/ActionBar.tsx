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
export function BarTotal({ amount, saved = 0, shipping, note }: { amount: number | null; saved?: number; shipping?: number | null; note?: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <div className="flex items-baseline gap-2 leading-none">
                <span className="font-mono text-label uppercase tracking-[.16em] text-grey">Total</span>
                <span className="font-mono text-lead font-semibold text-ink sm:text-title">{amount === null ? "—" : `₱${amount.toLocaleString()}`}</span>
            </div>
            {(shipping !== undefined || saved > 0) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-label leading-none text-grey">
                    {shipping !== undefined && (
                        <span>
                            Shipping {shipping === null ? "at checkout" : shipping > 0 ? `₱${shipping.toLocaleString()}` : <span className="text-success-dark">Free</span>}
                        </span>
                    )}
                    {saved > 0 && <span className="text-success-dark">Saved ₱{saved.toLocaleString()}</span>}
                </div>
            )}
            {note && <div className="mt-1.5 max-w-[320px] text-meta leading-snug text-grey">{note}</div>}
        </div>
    );
}

export const BAR_BUTTON =
    "ui-btn ui-btn-primary group flex-none disabled:bg-off disabled:text-grey disabled:opacity-100 disabled:hover:bg-off";

export function BarArrow() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-enabled:group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}
