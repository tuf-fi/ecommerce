// rounded-none overrides daisyUI's select radius; h-11 (not padding) matches SearchField's height since a <select>'s chrome renders taller.
export const FILTER_SELECT =
    "h-11 rounded-none border border-ink/10 bg-off/50 px-3.5 text-[12.5px] text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";

export default function SearchField({
    value,
    onChange,
    placeholder,
    className = "",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-1 items-center gap-2.5 border border-ink/10 bg-off/50 px-4 transition focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-1 ${className}`}
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-grey">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full bg-transparent py-[11px] text-sm text-ink outline-none placeholder:text-grey"
            />
        </div>
    );
}
