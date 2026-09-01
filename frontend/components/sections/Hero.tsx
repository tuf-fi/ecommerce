"use client";

import Image from "next/image";
import { heroImage } from "../ui/images";
import { useStore } from "@/library/store";
import { useContent } from "@/library/content";
import FadeIn from "../ui/motion/FadeIn";

const stats = [
    {
        title: "12,000+ happy customers",
        sub: "Skincare rituals delivered nationwide",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        title: "Dermatologist reviewed",
        sub: "Every formula tested for sensitivity",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
            </svg>
        ),
    },
    {
        title: "Cruelty-free, always",
        sub: "No animal testing, at any stage",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
        ),
    },
];

// `preview` renders inside the admin's live-preview pane — a fixed-size box,
// not the real viewport — so it drops the full-bleed negative-margin trick
// and the `h-screen` height in favor of a fixed size that fits the pane.
export default function Hero({ preview = false }: { preview?: boolean } = {}) {
    const { openModal } = useStore();
    const { hero } = useContent();

    function scrollTo(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <>
            <div className={preview ? "relative h-[420px]" : "relative -mx-8 w-[calc(100%+4rem)] h-screen"}>
                <Image src={hero.image ?? heroImage} alt="hero img" fill sizes="100vw" className="object-cover" priority={!preview} unoptimized={typeof hero.image === "string" && !!hero.image} />
                {/* Vignette, not a flat tint — keeps the top clear so the photo reads as
                    photography, darkens only where the copy needs contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

                <FadeIn className={`absolute bottom-14 left-0 w-full text-white ${preview ? "px-6" : "px-8"}`}>
                    <h1 className={preview ? "mt-3 text-[28px] leading-[1.05] font-normal" : "mt-3 font-normal"}>
                        {hero.headline}
                    </h1>
                    <p className="max-w-[400px] text-white/80">{hero.subtext}</p>

                    <div className="flex flex-row flex-wrap items-center gap-4 mt-8">
                        <button onClick={() => (preview ? undefined : scrollTo("bestsellers"))} className="group/cta flex items-center gap-2.5 bg-white px-6 py-4 text-ink text-[13.5px] font-semibold uppercase tracking-wide transition hover:bg-off">
                            {hero.cta}
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                        {!preview && (
                            <button onClick={() => openModal("quiz")} className="border border-white/40 px-6 py-4 text-[13.5px] font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10">
                                Find your Routine
                            </button>
                        )}
                    </div>
                </FadeIn>
            </div>

            {/* <div className="grid grid-cols-1 gap-8 py-14 sm:grid-cols-3">
                {stats.map((s) => (
                    <div key={s.title} className="flex items-start gap-3.5 border border-ink/10 p-6 transition hover:border-ink/25">
                        <span className="flex-none text-pink-dark">{s.icon}</span>
                        <div>
                            <div className="text-[14px] font-medium text-ink">{s.title}</div>
                            <div className="text-[12.5px] text-grey">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div> */}
        </>
    );
}
