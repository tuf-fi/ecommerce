const tintVar = {
    off: "var(--color-off)",
    "pink-soft": "var(--color-pink-soft)",
    "blue-soft": "var(--color-blue-soft)",
} as const;

export type SectionTint = keyof typeof tintVar;

// Ease-in-out fade curve (slow → fast → slow), not a linear ramp — reads as a
// soft, continuous wash flowing into neighboring sections rather than a
// color card with visible edges. Offsets are fixed px so the curve looks the
// same regardless of a section's height. Peak mix is capped well under 100%
// (unlike a plain background-color swap) so this reads as a light accent on
// top of the page's own gradient, not a competing block of color.
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
}: {
    children: React.ReactNode;
    id?: string;
    tint?: SectionTint;
}) {
    if (tint) {
        return (
            <div
                className="-mx-8 w-[calc(100%+4rem)] px-8"
                style={{ backgroundImage: fadeGradient(tintVar[tint]) }}
            >
                <div id={id} className="py-16">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div id={id} className="py-16">
            {children}
        </div>
    )
}
