"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import FadeIn from "../ui/motion/FadeIn";
import { contactImage } from "../ui/images";

export default function Contact() {
    const [sent, setSent] = useState(false);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSent(true);
    }

    return (
        <SectionContainer id="contact">
            <SectionTitle num="09" title="Contact" />

            <FadeIn className="grid grid-cols-[.85fr_1.15fr] gap-14">
                <div className="relative aspect-[4/5] overflow-hidden border border-ink/10">
                    <Image src={contactImage} alt="Contact" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                </div>

                <div className="flex h-full flex-col justify-end">
                    <h3 className="mb-6 text-[clamp(34px,4.2vw,54px)] leading-[0.98] font-medium text-ink">
                        Let&apos;s <br/><em className="font-normal text-pink-dark">talk skin.</em>
                    </h3>

                    <div className="grid grid-cols-2 divide-x divide-ink/15 border border-ink/15">
                        <div className="p-9">
                            {sent ? (
                                <div className="py-8">
                                    <div className="mb-3 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-success text-lg text-white">✓</div>
                                    <p className="mb-1.5 text-base font-medium text-ink">Message sent</p>
                                    <p className="text-[12.5px] text-grey">We&apos;ll get back to you within 1 business day.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <h4 className="mb-3 text-lg font-medium text-ink">Send a Message</h4>

                                    <div className="mb-6">
                                        <label className="mb-2 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Full Name</label>
                                        <input required placeholder="Your name" className="w-full border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="mb-2 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">E-mail</label>
                                        <input required type="email" placeholder="you@email.com" className="w-full border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark" />
                                    </div>
                                    <div className="mb-8">
                                        <label className="mb-2 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Message</label>
                                        <textarea required rows={2} placeholder="How can we help?" className="w-full resize-none border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark" />
                                    </div>
                                    <button type="submit" className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark">
                                        Contact Us
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="flex flex-col gap-8 p-9">
                            <div>
                                <h4 className="mb-1.5 text-lg font-medium text-ink">Contact</h4>
                                <a href="mailto:hello@cindyrella.ph" className="text-[13px] text-grey transition hover:text-pink-dark">hello@cindyrella.ph</a>
                            </div>

                            <div>
                                <h4 className="mb-1.5 text-lg font-medium text-ink">Based in</h4>
                                <p className="text-[13px] leading-relaxed text-grey">Makati City,<br />Metro Manila</p>
                            </div>

                            <div>
                                <h4 className="mb-3 text-lg font-medium text-ink">Follow</h4>
                                <div className="flex gap-2.5">
                                    <a aria-label="Instagram" href="#" className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="5" />
                                            <circle cx="12" cy="12" r="4" />
                                            <circle cx="17.5" cy="6.5" r="1" />
                                        </svg>
                                    </a>
                                    <a aria-label="TikTok" href="#" className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 3v9.5a3.5 3.5 0 1 1-3.5-3.5" />
                                            <path d="M16 3c.5 2.5 2.2 4.2 4.5 4.5" />
                                        </svg>
                                    </a>
                                    <a aria-label="Pinterest" href="#" className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M9.5 18l2-9M11.3 9c0-1 .9-1.7 2-1.7 1.4 0 2.5 1 2.5 2.6 0 2.1-1.1 3.9-2.8 3.9-.8 0-1.4-.4-1.6-1" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </SectionContainer>
    );
}
