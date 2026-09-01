"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { faqs } from "@/library/faq";
import PageHeading from "@/components/ui/PageHeading";

export default function HelpSupportPage() {
    return (
        <div>
            <PageHeading>Help & Support</PageHeading>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <a
                    href="mailto:hello@cindyrella.ph"
                    className="flex items-center justify-between gap-3 border border-ink/10 px-5 py-4 transition hover:border-ink/20"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/10 text-ink">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="m3 7 9 6 9-6" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-[13.5px] font-medium text-ink">Email Support</div>
                            <div className="text-[12px] text-grey">hello@cindyrella.ph</div>
                        </div>
                    </div>
                    <span className="flex-none text-grey">↗</span>
                </a>
                <a
                    href="tel:+639170000000"
                    className="flex items-center justify-between gap-3 border border-ink/10 px-5 py-4 transition hover:border-ink/20"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/10 text-ink">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.2a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2-.5c1 .4 2 .6 3 .7a2 2 0 0 1 1.6 2Z" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-[13.5px] font-medium text-ink">Call Us</div>
                            <div className="text-[12px] text-grey">+63 917 000 0000</div>
                        </div>
                    </div>
                    <span className="flex-none text-grey">↗</span>
                </a>
            </div>

            <div className="mb-4 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Frequently Asked Questions</div>
            <Accordion.Root type="single" collapsible className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                {faqs.map((item) => (
                    <Accordion.Item key={item.q} value={item.q} className="py-4">
                        <Accordion.Header>
                            <Accordion.Trigger className="group flex w-full cursor-pointer list-none items-center justify-between gap-6 text-left text-[13.5px] font-medium text-ink">
                                {item.q}
                                <span className="flex-none text-grey transition-transform group-data-[state=open]:rotate-90">›</span>
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <p className="mt-2.5 max-w-[520px] text-[12.5px] leading-relaxed text-grey">{item.a}</p>
                        </Accordion.Content>
                    </Accordion.Item>
                ))}
            </Accordion.Root>
        </div>
    );
}
