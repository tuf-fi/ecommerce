// Shared skeleton tones mirroring ShopGridSkeleton; onSolid exists for placeholders on solid brand-color cards where ink-based tones would be invisible.
type SkeletonTone = "fill" | "soft" | "faint" | "outline" | "onSolid";

const TONE_CLASS: Record<SkeletonTone, string> = {
    fill: "bg-ink/10",
    soft: "bg-ink/[0.06]",
    faint: "bg-ink/[0.04]",
    outline: "border border-ink/10 bg-ink/[0.03]",
    onSolid: "bg-white/20",
};

export default function Skeleton({ className = "", tone = "fill" }: { className?: string; tone?: SkeletonTone }) {
    return <span className={`block ${TONE_CLASS[tone]} ${className}`} />;
}

// Shares one pulse across all pieces (individually unanimated) so the group reads as one shape, not staggered flicker.
export function SkeletonGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div aria-hidden className={`animate-pulse ${className}`}>
            {children}
        </div>
    );
}
