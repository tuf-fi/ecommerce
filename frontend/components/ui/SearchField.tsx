// `rounded-none` overrides daisyUI's default corner radius on bare <select> elements.
// `h-11` (not padding-driven) so this lines up exactly with SearchField below — a
// <select>'s native chrome renders taller than a text input at identical padding.
export const FILTER_SELECT =
    "h-11 rounded-none border border-ink/10 bg-off/50 px-3.5 text-[12.5px] text-ink outline-none transition focus:border-navy/30";

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
        <div className={`flex h-11 flex-1 items-center gap-2.5 border border-ink/10 bg-off/50 px-4 ${className}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-grey">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-grey"
            />
        </div>
    );
}
