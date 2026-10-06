"use client";

import { FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/library/api/client";
import { sendContactMessage } from "@/library/api/marketing";
import Image from "next/image";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import { contactImage } from "../ui/images";
import { useAsyncAction } from "@/library/useAsyncAction";
import { useContent } from "@/library/content";

export default function Contact({ preview = false }: { preview?: boolean } = {}) {
    const { contact, contactInfo, socialLinks, sectionVisibility } = useContent();

    const [submitting, handleSubmit] = useAsyncAction(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const field = (id: string) => (form.elements.namedItem(id) as HTMLInputElement | HTMLTextAreaElement).value;
        try {
            await sendContactMessage({ name: field("contact-name"), email: field("contact-email"), message: field("contact-message") });
            form.reset();
            toast.success("Message sent", { description: "We'll get back to you within 1 business day." });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Couldn't send that. Please try again.");
        }
    });

    if (!preview && !sectionVisibility.contact) return null;

    return (
        <SectionContainer id={preview ? undefined : "contact"} preview={preview}>
            <SectionTitle section="contact" title="Contact" />

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-14">
                <div className="relative aspect-[4/3] overflow-hidden border sm:aspect-[16/9] lg:aspect-[4/5] border-ink/10">
                    <Image src={contactImage} alt="Contact" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                </div>

                <div className="flex h-full flex-col justify-end">
                    <h3 className="mb-6 text-[clamp(32px,4.2vw,54px)] leading-[0.98] font-medium text-ink">
                        {contact.headline} <br/><em className="font-normal text-pink-dark">{contact.accent}</em>
                    </h3>

                    <div className="grid grid-cols-1 divide-y divide-ink/15 border border-ink/15 md:grid-cols-2 md:divide-x md:divide-y-0">
                        <div className="p-6 sm:p-9">
                            <form onSubmit={handleSubmit}>
                                    <h4 className="mb-3 text-lg font-medium text-ink">Send a Message</h4>

                                    <div className="mb-6">
                                        <label htmlFor="contact-name" className="mb-2 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Full Name</label>
                                        <input id="contact-name" name="contact-name" required placeholder="Your name" className="w-full border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1" />
                                    </div>
                                    <div className="mb-6">
                                        <label htmlFor="contact-email" className="mb-2 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">E-mail</label>
                                        <input id="contact-email" name="contact-email" required type="email" placeholder="you@email.com" className="w-full border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1" />
                                    </div>
                                    <div className="mb-8">
                                        <label htmlFor="contact-message" className="mb-2 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Message</label>
                                        <textarea id="contact-message" name="contact-message" required rows={2} placeholder="How can we help?" className="w-full resize-none border-b border-ink/25 bg-transparent px-0.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-navy py-4 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                                    >
                                        {submitting ? "Sending…" : "Contact Us"}
                                    </button>
                            </form>
                        </div>

                        <div className="flex flex-col gap-8 p-6 sm:p-9">
                            <div>
                                <h4 className="mb-1.5 text-lg font-medium text-ink">Contact</h4>
                                <a href={`mailto:${contactInfo.email}`} className="block text-[13px] text-grey transition hover:text-pink-dark">{contactInfo.email}</a>
                                <a href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="block text-[13px] text-grey transition hover:text-pink-dark">{contactInfo.phone}</a>
                            </div>

                            <div>
                                <h4 className="mb-1.5 text-lg font-medium text-ink">Based in</h4>
                                <p className="text-[13px] leading-relaxed text-grey">{contactInfo.addressLine1}<br />{contactInfo.addressLine2}</p>
                            </div>

                            <div>
                                <h4 className="mb-3 text-lg font-medium text-ink">Follow</h4>
                                <div className="flex gap-2.5">
                                    {socialLinks.instagramEnabled && (
                                        <a aria-label="Instagram" href={socialLinks.instagramUrl} className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="5" />
                                                <circle cx="12" cy="12" r="4" />
                                                <circle cx="17.5" cy="6.5" r="1" />
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.tiktokEnabled && (
                                        <a aria-label="TikTok" href={socialLinks.tiktokUrl} className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 3v9.5a3.5 3.5 0 1 1-3.5-3.5" />
                                                <path d="M16 3c.5 2.5 2.2 4.2 4.5 4.5" />
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.pinterestEnabled && (
                                        <a aria-label="Pinterest" href={socialLinks.pinterestUrl} className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9" />
                                                <path d="M9.5 18l2-9M11.3 9c0-1 .9-1.7 2-1.7 1.4 0 2.5 1 2.5 2.6 0 2.1-1.1 3.9-2.8 3.9-.8 0-1.4-.4-1.6-1" />
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.facebookEnabled && (
                                        <a aria-label="Facebook" href={socialLinks.facebookUrl} className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9" />
                                                <path d="M13.2 20.5v-6.8h2.2l.4-2.7h-2.6v-1.7c0-.8.2-1.3 1.3-1.3h1.4V5.5a12 12 0 0 0-2-.2c-2 0-3.4 1.2-3.4 3.4v1.9H8.3v2.7h2.2v6.8" />
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.xEnabled && (
                                        <a aria-label="X" href={socialLinks.xUrl} className="flex h-[36px] w-[36px] items-center justify-center bg-navy text-white transition hover:bg-pink-dark">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="5" />
                                                <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SectionContainer>
    );
}
