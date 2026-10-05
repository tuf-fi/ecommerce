"use client";

import { useEffect, useRef } from "react";

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
        // Padding mirrors FILTER_SELECT to the pixel so this reads as the same control family in a shared toolbar row.
        <div
            className={`relative flex h-11 flex-1 items-center border border-ink/10 bg-white outline-none transition focus-within:border-navy/30 focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-1 ${className}`}
        >
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel ?? placeholder}
                className="w-full bg-transparent pl-3.5 pr-8 py-[11px] text-[12.5px] text-ink outline-none placeholder:text-grey"
            />
            <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey/60"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
        </div>
    );
}
