"use client";

import * as Accordion from "@radix-ui/react-accordion";
import Link from "next/link";
import { faqs } from "@/library/faq";

// Shared by /help (public) and /account/help (inside the account shell).
export default function HelpContent() {
    return (
        <div>
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <a href="mailto:hello@cindyrella.ph" className="group flex items-center justify-between gap-3 border border-ink/10 px-5 py-4 transition hover:border-pink-btn/40">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/10 text-ink transition group-hover:border-pink-btn/40 group-hover:text-pink-dark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="m3 7 9 6 9-6" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-small font-medium text-ink">Email support</div>
                            <div className="text-meta text-grey">hello@cindyrella.ph</div>
                        </div>
                    </div>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-grey transition group-hover:text-pink-dark">
                        <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                </a>
                <Link href="/pages/shipping-returns" className="group flex items-center justify-between gap-3 border border-ink/10 px-5 py-4 transition hover:border-pink-btn/40">
                    <div>
                        <div className="text-small font-medium text-ink">Shipping &amp; returns</div>
                        <div className="text-meta text-grey">Fees, delivery times, returns and refunds</div>
                    </div>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-grey transition group-hover:text-pink-dark">
                        <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                </Link>
            </div>

            <div className="mb-4 font-mono text-label uppercase tracking-[.16em] text-grey">Frequently asked questions</div>
            <Accordion.Root type="single" collapsible className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                {faqs.map((item) => (
                    <Accordion.Item key={item.q} value={item.q} className="py-1">
                        <Accordion.Header>
                            <Accordion.Trigger className="group flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-6 text-left text-small font-medium text-ink transition hover:text-pink-dark">
                                {item.q}
                                <span className="flex-none text-grey transition-[transform,color] group-hover:text-pink-dark group-data-[state=open]:rotate-90">›</span>
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <p className="mb-3 max-w-[520px] text-meta leading-relaxed text-grey">{item.a}</p>
                        </Accordion.Content>
                    </Accordion.Item>
                ))}
            </Accordion.Root>
        </div>
    );
}
