import Link from "next/link";
import { buttonClass } from "./Button";

// One empty-state pattern for storefront, account and admin: no box, a short title, a plain message, one way forward.
export default function EmptyState({
    title,
    message,
    action,
    // Kept for callers that already sit inside their own panel; the layout is the same either way now.
    bare: _bare,
}: {
    title?: string;
    message: string;
    action?: { label: string; href: string } | React.ReactNode;
    bare?: boolean;
}) {
    void _bare;
    const cta =
        action && typeof action === "object" && "href" in (action as object) && "label" in (action as object) ? (
            <Link href={(action as { href: string }).href} className={buttonClass({ variant: "secondary" })}>
                {(action as { label: string }).label}
            </Link>
        ) : (
            (action as React.ReactNode)
        );
    return (
        <div className="mx-auto flex max-w-[420px] flex-col items-center py-10 text-center md:py-14">
            {title && <h3 className="m-0 mb-2 text-subhead font-medium text-ink">{title}</h3>}
            <p className={`m-0 text-small leading-relaxed text-grey ${cta ? "mb-7" : ""}`}>{message}</p>
            {cta}
        </div>
    );
}
