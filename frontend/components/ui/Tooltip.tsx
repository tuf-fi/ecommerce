export default function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="group/tooltip relative inline-flex">
            {children}
            <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap bg-ink px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[.08em] text-white opacity-0 shadow-modal transition-all duration-200 ease-out group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100"
            >
                {label}
            </span>
        </div>
    );
}
