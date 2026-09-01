// TODO: swap for real product/lifestyle photography once assets exist.
const variants = {
    pastel: "bg-pastel-diagonal",
    pink: "bg-gradient-to-br from-pink-soft to-white",
    blue: "bg-gradient-to-br from-blue-soft to-white",
    ink: "bg-gradient-to-br from-ink to-[#2C4356]",
};

export type PlaceholderVariant = keyof typeof variants;

export default function Placeholder({
    variant = "pastel",
    className = "",
}: {
    variant?: PlaceholderVariant;
    className?: string;
}) {
    return <div aria-hidden className={`${variants[variant]} ${className}`} />;
}
