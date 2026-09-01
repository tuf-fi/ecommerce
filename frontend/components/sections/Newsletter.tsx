"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import FadeIn from "../ui/motion/FadeIn";
import { newsletterImage } from "../ui/images";

export default function Newsletter() {
    const [subscribed, setSubscribed] = useState(false);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubscribed(true);
    }

    return (
        <div className="relative z-10 pt-8 -mb-16">
            <FadeIn className="grid grid-cols-[.85fr_1.15fr] items-stretch gap-0 border border-ink/10">
                <div className="relative overflow-hidden">
                    <Image src={newsletterImage} alt="Join the ritual" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                </div>

                <div className="flex flex-col justify-center gap-5 border-l border-ink/10 bg-off p-14">
                    {/* <span className="eyebrow text-pink-dark">✦ The Ritual List</span> */}
                    <h2 className="text-[clamp(28px,3.2vw,42px)] leading-[1.05] font-medium text-ink">
                        Join the <em className="font-normal text-pink-dark">ritual.</em>
                    </h2>

                    <p className="text-[13.5px] text-grey">
                        First access to new formulas, routine tips, and members-only offers — straight to your inbox.
                    </p>

                    {subscribed ? (
                        <p className="text-sm font-medium text-ink">
                            You&apos;re on the list! Check your inbox for your 10% off code.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <input type="email" required placeholder="Your email address" className="min-w-0 flex-1 border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition focus:border-pink-dark" />
                            <button type="submit" className="flex-none bg-pink-btn px-6 py-3 text-xs font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover">
                                Subscribe
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-1.5 text-[11.5px] text-grey">
                        <span className="text-xs tracking-widest text-gold">★★★★★</span> Loved by 12,000+ skincare routines
                    </div>
                </div>
            </FadeIn>
        </div>
    );
}
