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
        <div className={`flex flex-1 items-center gap-2.5 border border-ink/10 bg-off/50 px-4 py-3 ${className}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-grey">
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
