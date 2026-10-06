"use client";

import { useContent } from "@/library/content";
import { safeHref } from "@/library/url-safety";

// Deliberately not gated by `sectionVisibility` — it's sitewide chrome, not a homepage section.
// `preview` drops the bleed trick (it assumes the real site's 2rem body padding, which the admin's clamped preview box doesn't have).
export default function Footer({ preview = false }: { preview?: boolean } = {}) {
    const { contactInfo, socialLinks, footerShopLinks, footerCompanyLinks, footerPaymentMethods } = useContent();

    return (
        <footer className={`${preview ? "w-full" : "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)]"} bg-footer pt-16 text-white`}>
            <div className="mx-auto max-w-[1320px] px-(--gutter) pb-8 sm:px-12">
                <div className="grid grid-cols-1 gap-8 border-b border-white/10 py-10 md:grid-cols-3 md:divide-x md:divide-white/10 md:py-12">
                    <div className="md:pr-8">
                        <h4 className="eyebrow mb-2 uppercase text-pink">Contact Us</h4>
                        <p className="text-[13px] leading-relaxed text-grey-light">{contactInfo.email}<br />{contactInfo.phone}</p>
                    </div>
                    <div className="md:px-8">
                        <h4 className="eyebrow mb-2 uppercase text-pink">Based In</h4>
                        <p className="text-[13px] leading-relaxed text-grey-light">{contactInfo.addressLine1}<br />{contactInfo.addressLine2}</p>
                    </div>
                    <div className="md:pl-8">
                        <h4 className="eyebrow mb-2 uppercase text-pink">Customer Care Hours</h4>
                        <p className="text-[13px] leading-relaxed text-grey-light">{contactInfo.hoursLine1}<br />{contactInfo.hoursLine2}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-12 border-b border-white/10 py-12 md:py-16 lg:grid-cols-[1.2fr_.8fr_.8fr_.9fr] lg:gap-14">
                    <div className="col-span-2 max-w-[300px] lg:col-span-1">
                        <h3 className="mb-4 text-xl font-normal text-white">Cindyrella</h3>
                        <p className="mb-7 text-[12.5px] leading-relaxed text-grey-light">
                            Skin care built on fewer, better ingredients — and a routine designed to actually stick.
                        </p>
                        <div className="flex gap-2.5">
                            {socialLinks.instagramEnabled && (
                                <a aria-label="Instagram" href={safeHref(socialLinks.instagramUrl)} className="flex h-11 w-11 sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/15 text-white opacity-80 transition hover:-translate-y-0.5 hover:border-pink hover:bg-white/8 hover:opacity-100">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.tiktokEnabled && (
                                <a aria-label="TikTok" href={safeHref(socialLinks.tiktokUrl)} className="flex h-11 w-11 sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/15 text-white opacity-80 transition hover:-translate-y-0.5 hover:border-pink hover:bg-white/8 hover:opacity-100">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 3v9.5a3.5 3.5 0 1 1-3.5-3.5" />
                                        <path d="M16 3c.5 2.5 2.2 4.2 4.5 4.5" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.pinterestEnabled && (
                                <a aria-label="Pinterest" href={safeHref(socialLinks.pinterestUrl)} className="flex h-11 w-11 sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/15 text-white opacity-80 transition hover:-translate-y-0.5 hover:border-pink hover:bg-white/8 hover:opacity-100">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M9.5 18l2-9M11.3 9c0-1 .9-1.7 2-1.7 1.4 0 2.5 1 2.5 2.6 0 2.1-1.1 3.9-2.8 3.9-.8 0-1.4-.4-1.6-1" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.facebookEnabled && (
                                <a aria-label="Facebook" href={safeHref(socialLinks.facebookUrl)} className="flex h-11 w-11 sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/15 text-white opacity-80 transition hover:-translate-y-0.5 hover:border-pink hover:bg-white/8 hover:opacity-100">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M13.2 20.5v-6.8h2.2l.4-2.7h-2.6v-1.7c0-.8.2-1.3 1.3-1.3h1.4V5.5a12 12 0 0 0-2-.2c-2 0-3.4 1.2-3.4 3.4v1.9H8.3v2.7h2.2v6.8" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.xEnabled && (
                                <a aria-label="X" href={safeHref(socialLinks.xUrl)} className="flex h-11 w-11 sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/15 text-white opacity-80 transition hover:-translate-y-0.5 hover:border-pink hover:bg-white/8 hover:opacity-100">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="5" />
                                        <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="eyebrow mb-5 uppercase">Shop</h4>
                        <ul className="flex flex-col gap-3">
                            {footerShopLinks.map((link) => (
                                <li key={link.id}>
                                    <a href={safeHref(link.href)} className="text-[13px] text-grey-light transition hover:text-white">{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="eyebrow mb-5 uppercase">Company</h4>
                        <ul className="flex flex-col gap-3">
                            {footerCompanyLinks.map((link) => (
                                <li key={link.id}>
                                    <a href={safeHref(link.href)} className="text-[13px] text-grey-light transition hover:text-white">{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                        <h4 className="eyebrow mb-5 uppercase">We Accept</h4>
                        <ul className="flex flex-wrap gap-2">
                            {footerPaymentMethods.map((label) => (
                                <li key={label} className="border border-white/15 px-3 py-1.5 text-[11.5px] text-grey-light">
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-7 text-[11.5px] text-grey sm:flex-row sm:items-center sm:justify-between">
                    <span>&copy; 2026 Cindyrella. All rights reserved.</span>
                    <span>Considered skin care, made in Metro Manila.</span>
                </div>
            </div>
        </footer>
    );
}
