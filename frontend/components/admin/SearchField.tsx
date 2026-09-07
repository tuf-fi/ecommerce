"use client";

import { useEffect, useRef } from "react";

// "/" jumps focus here from anywhere on the page (unless the user is already
// typing in some other field) — the one keyboard accelerator every admin
// list page shares, since every one of them opens with a search box.
function isTypingTarget(el: EventTarget | null) {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function SearchField({
    value,
    onChange,
    placeholder,
    ariaLabel,
    className = "",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    ariaLabel?: string;
    className?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(document.activeElement)) return;
            e.preventDefault();
            inputRef.current?.focus();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className={`flex h-11 flex-1 items-center gap-2.5 border border-ink/10 bg-off/50 px-4 ${className}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-grey">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel ?? placeholder}
                className="w-full bg-transparent text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 placeholder:text-grey"
            />
        </div>
    );
}
