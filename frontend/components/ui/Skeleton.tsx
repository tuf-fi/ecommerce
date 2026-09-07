// Shared placeholder primitives for page-load skeletons. Every page's real
// data currently comes from an in-memory mock store (see useMounted), so
// these mirror the tones ShopGridSkeleton already established rather than
// introducing a new fill system: `fill` for text-line bars, `soft`/`faint`
// for secondary text and image blocks, `outline` for input/control shapes.
type SkeletonTone = "fill" | "soft" | "faint" | "outline";

const TONE_CLASS: Record<SkeletonTone, string> = {
    fill: "bg-ink/10",
    soft: "bg-ink/[0.06]",
    faint: "bg-ink/[0.04]",
    outline: "border border-ink/10 bg-ink/[0.03]",
};

export default function Skeleton({ className = "", tone = "fill" }: { className?: string; tone?: SkeletonTone }) {
    return <span className={`block ${TONE_CLASS[tone]} ${className}`} />;
}

// Wraps a set of Skeleton pieces with one shared pulse and hides the whole
// placeholder from assistive tech — individual pieces stay unanimated so the
// group reads as one shape pulsing, not staggered flicker.
export function SkeletonGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div aria-hidden className={`animate-pulse ${className}`}>
            {children}
        </div>
    );
}
