"use client";

// Square checkbox in the site's flat style; a real <input> underneath so it stays keyboard- and screen-reader-friendly.
export default function Checkbox({
    checked,
    indeterminate = false,
    onChange,
    label,
    ariaLabel,
    className = "",
}: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: (next: boolean) => void;
    label?: React.ReactNode;
    ariaLabel?: string;
    className?: string;
}) {
    const on = checked || indeterminate;

    return (
        <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 ${className}`}>
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                aria-label={ariaLabel}
                aria-checked={indeterminate ? "mixed" : checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span
                aria-hidden="true"
                className={`flex h-[18px] w-[18px] flex-none items-center justify-center border transition peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-2 ${
                    on ? "border-navy bg-navy text-white" : "border-ink/30 bg-white hover:border-ink/60"
                }`}
            >
                {indeterminate ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                        <path d="M5 12h14" />
                    </svg>
                ) : (
                    checked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    )
                )}
            </span>
            {label}
        </label>
    );
}
