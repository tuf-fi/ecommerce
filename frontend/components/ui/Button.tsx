import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Single source for button styling; also usable on <Link>/<a> via buttonClass().
export function buttonClass({ variant = "primary", size = "md", block = false, className = "" }: { variant?: Variant; size?: Size; block?: boolean; className?: string } = {}) {
    return ["ui-btn", `ui-btn-${variant}`, size === "sm" && "ui-btn-sm", size === "lg" && "ui-btn-lg", block && "ui-btn-block", className].filter(Boolean).join(" ");
}

type Shared = { variant?: Variant; size?: Size; block?: boolean };

export default function Button({ variant, size, block, className, ...rest }: Shared & ComponentProps<"button">) {
    return <button type="button" {...rest} className={buttonClass({ variant, size, block, className })} />;
}

export function ButtonLink({ variant, size, block, className, ...rest }: Shared & ComponentProps<typeof Link>) {
    return <Link {...rest} className={buttonClass({ variant, size, block, className })} />;
}
