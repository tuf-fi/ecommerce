const tintVar = {
    off: "var(--color-off)",
    "pink-soft": "var(--color-pink-soft)",
    "blue-soft": "var(--color-blue-soft)",
} as const;

export type SectionTint = keyof typeof tintVar;

// Ease-in-out fade curve with fixed px offsets (consistent regardless of height) and a capped peak mix, so it reads as a soft accent, not a color block.
const FADE = [
    { offset: 0, mix: 0 },
    { offset: 25, mix: 14 },
    { offset: 50, mix: 30 },
    { offset: 75, mix: 42 },
    { offset: 100, mix: 48 },
] as const;

function stopColor(color: string, mix: number) {
    return mix <= 0 ? "transparent" : `color-mix(in srgb, ${color} ${mix}%, transparent)`;
}

function fadeGradient(color: string) {
    const top = FADE.map(({ offset, mix }) => `${stopColor(color, mix)} ${offset}px`);
    const bottom = [...FADE]
        .reverse()
        .map(({ offset, mix }) => `${stopColor(color, mix)} calc(100% - ${offset}px)`);
    return `linear-gradient(to bottom, ${[...top, ...bottom].join(", ")})`;
}

export default function SectionContainer({
    children,
    id,
    tint,
    preview = false,
}: {
    children: React.ReactNode;
    id?: string;
    tint?: SectionTint;
    // Drops the full-bleed negative-margin trick; the admin preview pane is already edge to edge (see Hero.tsx).
    preview?: boolean;
}) {
    if (tint) {
        return (
            <div
                className={preview ? "" : "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] px-(--gutter)"}
                style={{ backgroundImage: fadeGradient(tintVar[tint]) }}
            >
                <div id={id} className={`py-14 md:py-20 ${preview ? "px-9" : ""}`}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div id={id} className={`py-14 md:py-20 ${preview ? "px-9" : ""}`}>
            {children}
        </div>
    )
}
