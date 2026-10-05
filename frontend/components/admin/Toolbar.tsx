// Shared toolbar shell for admin list pages. Staff/Orders/Inventory/Movements
// Actions always sit on their own row, right-aligned, above the filters row —
// order is fixed by the component, not by prop/JSX order at each call site.
export function Toolbar({
    meta,
    actions,
    filters,
}: {
    meta?: string;
    actions?: React.ReactNode;
    filters?: React.ReactNode;
}) {
    return (
        <div className="mb-5">
            {meta && <div className="mb-3 text-right font-mono text-[11px] text-grey">{meta}</div>}
            {actions && <div className="mb-4 flex flex-wrap items-center justify-end gap-2.5">{actions}</div>}
            {filters}
        </div>
    );
}

export function ListMeta({ children }: { children: React.ReactNode }) {
    return <div className="mt-3 text-right font-mono text-[11px] text-grey">{children}</div>;
}

export function ToolbarFilters({ children }: { children: React.ReactNode }) {
    return <div className="flex w-full flex-wrap items-end gap-4">{children}</div>;
}

export function ToolbarActions({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function FilterField({
    label,
    className = "",
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <span className="font-mono text-[10px] tracking-[.12em] text-grey/70 uppercase">{label}</span>
            {children}
        </div>
    );
}
