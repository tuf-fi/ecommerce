// A tone system deliberately separate from StatusBadge's TONE_CLASSES and StatCard's tones — do not unify or add a fourth.
export type StatTileTone = "success" | "warning" | "alert" | "neutral" | "blue";

export const STAT_TONE_CLASSES: Record<StatTileTone, string> = {
    success: "bg-success",
    // Amber, not pink-dark — pink is reserved for CTAs/accents; warning needs its own hue.
    warning: "bg-amber",
    alert: "bg-alert",
    neutral: "bg-navy",
    blue: "bg-blue-accent",
};

// Hue-matched shadow per tile, tinted from its own fill, instead of the generic neutral `shadow-card`.
export const STAT_TONE_SHADOW: Record<StatTileTone, string> = {
    success: "shadow-[0_10px_22px_-10px_rgba(34,122,76,0.55)] hover:shadow-[0_18px_32px_-10px_rgba(34,122,76,0.6)]",
    warning: "shadow-[0_10px_22px_-10px_rgba(242,153,74,0.55)] hover:shadow-[0_18px_32px_-10px_rgba(242,153,74,0.6)]",
    alert: "shadow-[0_10px_22px_-10px_rgba(166,52,43,0.55)] hover:shadow-[0_18px_32px_-10px_rgba(166,52,43,0.6)]",
    neutral: "shadow-[0_10px_22px_-10px_rgba(15,32,54,0.6)] hover:shadow-[0_18px_32px_-10px_rgba(15,32,54,0.65)]",
    blue: "shadow-[0_10px_22px_-10px_rgba(40,102,189,0.55)] hover:shadow-[0_18px_32px_-10px_rgba(40,102,189,0.6)]",
};

export default function StatTile({
    label,
    count,
    tone,
    active,
    onClick,
}: {
    label: string;
    count: number;
    tone: StatTileTone;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-5 text-left text-white transition hover:-translate-y-0.5 ${STAT_TONE_CLASSES[tone]} ${STAT_TONE_SHADOW[tone]} ${
                active ? "-translate-y-0.5 ring-2 ring-inset ring-white/70" : ""
            }`}
        >
            <div className="mb-2 font-mono text-[10px] tracking-[.08em] text-white/80 uppercase">{label}</div>
            <div className="font-display text-[26px] font-semibold tabular-nums text-white">{count}</div>
        </button>
    );
}
