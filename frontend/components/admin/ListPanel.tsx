// Table scrolls inside its own box on narrow viewports rather than forcing page-level horizontal scroll.
export default function ListPanel({
    minWidth,
    tableClassName = "w-full border-collapse",
    footer,
    children,
}: {
    minWidth?: number;
    tableClassName?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden border border-ink/10 bg-white shadow-card">
            <div className="overflow-x-auto">
                <table className={tableClassName} style={minWidth ? { minWidth } : undefined}>
                    {children}
                </table>
            </div>
            {footer && (
                <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right font-mono text-[11px] text-grey">
                    {footer}
                </div>
            )}
        </div>
    );
}
