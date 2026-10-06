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

// Bordered table-shaped placeholder for admin lists while the first page loads.
export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <SkeletonGroup className="border border-ink/10 bg-white">
            <div className="flex gap-6 border-b border-ink/10 px-5 py-4">
                {Array.from({ length: cols }).map((_, c) => (
                    <Skeleton key={c} tone="soft" className="h-[10px] flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-6 border-b border-ink/10 px-5 py-4 last:border-b-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} className={`h-3 flex-1 ${c === 0 ? "max-w-[40%]" : ""}`} />
                    ))}
                </div>
            ))}
        </SkeletonGroup>
    );
}
