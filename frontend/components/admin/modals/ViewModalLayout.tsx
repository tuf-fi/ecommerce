// Shared chrome for read-only "view" modals — a hairline spec-sheet, no boxed/shadowed "card". Heading always leads.

export function ViewHeader({
    title,
    caption,
    badge,
    thumbnail,
}: {
    title: string;
    // Secondary line under the title (SKU, role, date) — never a section eyebrow.
    caption?: React.ReactNode;
    // Status/role chip, pinned to the header's top-right corner.
    badge?: React.ReactNode;
    thumbnail?: React.ReactNode;
}) {
    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/10 bg-white py-5 pl-5 pr-14 sm:pl-8 sm:pr-16">
            {thumbnail}
            <div className="min-w-0 flex-1 basis-[140px]">
                <h3 className="truncate text-lg font-medium text-ink">{title}</h3>
                {caption && <div className="mt-1 truncate text-[12px] text-grey">{caption}</div>}
            </div>
            {badge && <div className="order-last flex-none basis-full pt-0.5 sm:order-none sm:basis-auto sm:self-start">{badge}</div>}
        </div>
    );
}

// A mono-label divider marking where a new cluster of facts starts.
export function SectionLabel({ label }: { label: string }) {
    return (
        <div className="mb-3 flex items-center gap-3 pt-1 first:pt-0">
            <span className="flex-none font-mono text-[10px] uppercase tracking-[.14em] text-grey">{label}</span>
            <span className="h-px flex-1 bg-ink/10" />
        </div>
    );
}

// `lg` size is for the one or two headline numbers a record is opened to check (price, stock); `sm` (default) for compact facts.
export function FactRow({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-wrap border-b border-ink/10">{children}</div>;
}

export function FactCell({
    label,
    value,
    tone = "default",
    size = "sm",
}: {
    label: string;
    value: React.ReactNode;
    tone?: "default" | "alert" | "warning";
    size?: "sm" | "lg";
}) {
    const toneClass = tone === "alert" ? "text-alert" : tone === "warning" ? "text-amber-dark" : "text-ink";
    return (
        <div className="min-w-[45%] flex-1 border-r border-ink/10 px-5 py-4 last:border-r-0 sm:min-w-0 sm:px-8">
            <span className="block font-mono text-[10px] uppercase tracking-[.14em] text-grey">{label}</span>
            <span
                className={`mt-1.5 block break-words sm:truncate ${size === "lg" ? "font-display text-xl font-medium sm:text-2xl" : "text-[13.5px]"} ${toneClass}`}
            >
                {value}
            </span>
        </div>
    );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 py-3.5 sm:gap-6 last:border-0">
            <span className="flex-none pt-0.5 font-mono text-[10px] uppercase tracking-[.14em] text-grey">{label}</span>
            <span className="min-w-0 text-right text-[13px] break-words text-ink/85">{value}</span>
        </div>
    );
}

export function DetailBody({ children }: { children: React.ReactNode }) {
    return <div className="px-5 sm:px-8 pt-5 pb-7">{children}</div>;
}

export type SizeRowData = { id: string; label: string; price: number; stock: number; tone?: "default" | "alert" | "warning" };

export function SizeTable({ sizes }: { sizes: SizeRowData[] }) {
    return (
        <div className="border border-ink/10">
            <div className="flex gap-4 border-b border-ink/10 bg-off/60 px-4 py-2.5">
                <span className="flex-1 font-mono text-[10px] uppercase tracking-[.14em] text-grey">Size</span>
                <span className="w-16 flex-none text-right font-mono text-[10px] uppercase tracking-[.14em] text-grey">Price</span>
                <span className="w-14 flex-none text-right font-mono text-[10px] uppercase tracking-[.14em] text-grey">Stock</span>
            </div>
            {sizes.map((s, i) => {
                const toneClass = s.tone === "alert" ? "text-alert" : s.tone === "warning" ? "text-amber-dark" : "text-ink";
                return (
                    <div
                        key={s.id}
                        className={`flex items-center gap-4 px-4 py-2.5 ${i < sizes.length - 1 ? "border-b border-ink/10" : ""}`}
                    >
                        <span className="flex-1 truncate text-[13px] text-ink">{s.label}</span>
                        <span className="w-16 flex-none text-right font-mono text-[12.5px] text-ink">₱{s.price.toLocaleString()}</span>
                        <span className={`w-14 flex-none text-right font-mono text-[12.5px] ${toneClass}`}>{s.stock}</span>
                    </div>
                );
            })}
        </div>
    );
}
