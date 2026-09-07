// Shared chrome for read-only "view" modals — mirrors the sticky
// header/footer structure of the edit modals (ProductModal, FaqModal, …) so
// both feel like the same system, but trades form fields for a hairline
// spec-sheet: a mono label on the left, the value right-aligned, one row
// per fact, no boxed/shadowed "card" around it.

export function ViewHeader({
    eyebrow,
    title,
    meta,
    thumbnail,
}: {
    eyebrow: string;
    title: string;
    // Badge or short line rendered under the title (status, role, position…).
    meta?: React.ReactNode;
    thumbnail?: React.ReactNode;
}) {
    return (
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-ink/10 bg-white px-8 py-5">
            {thumbnail}
            <div className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[.14em] text-grey">{eyebrow}</span>
                <h3 className="mt-0.5 truncate text-lg font-medium text-ink">{title}</h3>
                {meta && <div className="mt-1.5">{meta}</div>}
            </div>
        </div>
    );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-6 border-b border-ink/10 py-3.5 last:border-0">
            <span className="flex-none pt-0.5 font-mono text-[10px] uppercase tracking-[.14em] text-grey">{label}</span>
            <span className="text-right text-[13px] text-ink/85">{value}</span>
        </div>
    );
}

export function DetailBody({ children }: { children: React.ReactNode }) {
    return <div className="px-8 pt-1 pb-7">{children}</div>;
}
