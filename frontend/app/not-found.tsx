import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
    return (
        <div className="-mx-[var(--gutter)] flex min-h-screen w-[calc(100%+var(--gutter)*2)] flex-col justify-center bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+3rem)] pb-24">
            <div className="max-w-[560px]">
                <span className="mb-6 block font-mono text-label uppercase tracking-[.16em] text-grey">404</span>
                <h1 className="mb-4 text-[clamp(30px,5vw,46px)] leading-[1.05]">
                    That page isn&apos;t here.
                </h1>
                <p className="m-0 mb-8 max-w-[420px] text-small leading-relaxed text-grey">The link may be old, or the page may have moved. Start from the shop, or head back home.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/shop" className={buttonClass({ variant: "primary" })}>
                        Browse the shop
                    </Link>
                    <Link href="/" className={buttonClass({ variant: "secondary" })}>
                        Back home
                    </Link>
                </div>
            </div>
        </div>
    );
}
