export type BadgeTone = "success" | "warning" | "alert" | "neutral";

// The one tone system for inline status pills — route through this rather than hand-rolling tone classes. Don't unify with StatTile.
const TONE_CLASSES: Record<BadgeTone, string> = {
    success: "bg-success/10 text-success-dark",
    // Amber, not pink — pink is reserved for CTAs/accents; warning needs its own hue.
    warning: "bg-amber/10 text-amber-dark",
    alert: "bg-alert/10 text-alert",
    neutral: "bg-blue-soft text-ink",
};

export default function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
    return (
        <span className={`inline-block rounded-pill px-2.5 py-1 text-[11px] font-semibold tracking-[.01em] ${TONE_CLASSES[tone]}`}>
            {label}
        </span>
    );
}
