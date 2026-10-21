import Link from "next/link";

export const metadata = { title: "Unsubscribed", robots: { index: false } };

// Where the unsubscribe link in our emails lands once the server has removed the address.
export default function UnsubscribedPage() {
    return (
        <div className="-mx-[var(--gutter)] flex min-h-screen w-[calc(100%+var(--gutter)*2)] flex-col items-center justify-center gap-4 bg-white px-[var(--gutter)] py-32 text-center">
            <h1 className="text-heading font-medium text-ink">You&apos;re unsubscribed</h1>
            <p className="max-w-[360px] text-small leading-relaxed text-grey">
                We won&apos;t send you any more newsletters or promotions. Order updates for purchases you&apos;ve made will still reach you.
            </p>
            <Link
                href="/"
                className="ui-btn ui-btn-secondary mt-2"
            >
                Back to the shop
            </Link>
        </div>
    );
}
