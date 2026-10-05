// Shared icon set, previously copy-pasted byte-for-byte across Inventory, Staff, and every Content tab.

export function EditIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
        </svg>
    );
}

export function TrashIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

// Same mark as ContentEditorShell's own "Back to X" control, shared so every "Back to X" link reads the same.
export function BackIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
    );
}

export function ImportIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 15V3" />
            <path d="M7 8l5-5 5 5" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>
    );
}

export function ExportIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>
    );
}

// Takes a click handler rather than an href since some call sites need an unsaved-changes guard before navigating.
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink transition hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
        >
            <BackIcon /> Back to {label}
        </button>
    );
}
