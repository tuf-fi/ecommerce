// Admin-entered href/URL scheme allowlist — without it an admin could plant a `javascript:` URI that runs for every visitor who clicks it.
const ALLOWED_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

export function isSafeHref(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    // Relative paths, in-page anchors, and the "#" placeholder never carry an executable scheme — always safe.
    if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
    // Rejects embedded control characters (tab/newline tricks some browsers tolerated inside "java\tscript:").
    if (/[\x00-\x1f]/.test(trimmed)) return false;
    try {
        // Protocol-relative URLs ("//example.com") need a base to parse against — resolved against a dummy https base.
        const url = new URL(trimmed, trimmed.startsWith("//") ? "https:" : undefined);
        return ALLOWED_SCHEMES.includes(url.protocol);
    } catch {
        return false;
    }
}

// Last line of defense at the render site (Footer.tsx) — never throws, always returns something safe for `href`.
export function safeHref(value: string | undefined | null): string {
    if (!value) return "#";
    return isSafeHref(value) ? value : "#";
}
