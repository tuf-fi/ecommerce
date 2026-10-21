import type { Metadata } from "next";
import HelpContent from "@/components/pages/HelpContent";

export const metadata: Metadata = {
    title: "Help & Support",
    description: "Answers about orders, payment, delivery and returns, and how to reach us.",
};

export default function HelpPage() {
    return (
        <div className="-mx-[var(--gutter)] min-h-screen w-[calc(100%+var(--gutter)*2)] bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+3rem)] pb-24">
            <div className="max-w-[720px]">
                <span className="mb-6 block font-mono text-label uppercase tracking-[.16em] text-grey">Help &amp; support</span>
                <h1 className="mb-8 text-[clamp(30px,5vw,46px)] leading-[1.05]">How can we help?</h1>
                <HelpContent />
            </div>
        </div>
    );
}
