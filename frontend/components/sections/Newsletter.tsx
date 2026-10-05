"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/library/api/client";
import { subscribeToNewsletter } from "@/library/api/marketing";
import Image from "next/image";
import { newsletterImage } from "../ui/images";
import { useAsyncAction } from "@/library/useAsyncAction";
import { NewsletterContent, useContent } from "@/library/content";

// `previewData` lets NewsletterEditor feed in its local unsaved draft — see Hero.tsx.
export default function Newsletter({
    preview = false,
    previewData,
}: { preview?: boolean; previewData?: NewsletterContent } = {}) {
    const { newsletter: liveNewsletter, sectionVisibility } = useContent();
    const newsletter = previewData ?? liveNewsletter;
    const [subscribed, setSubscribed] = useState(false);

    const [submitting, handleSubmit] = useAsyncAction(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("newsletter-email") as HTMLInputElement;
        try {
            await subscribeToNewsletter(input.value);
            setSubscribed(true);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Couldn't send that. Please try again.");
        }
    });

    if (!preview && !sectionVisibility.newsletter) return null;

    return (
        // Negative bottom margin pulls this over the footer's top edge; in the admin preview (no footer below) it just clips.
        <div id={preview ? undefined : "newsletter"} className={preview ? "p-9" : "relative z-10 pt-8 -mb-16"}>
            <div className="grid grid-cols-[.85fr_1.15fr] items-stretch gap-0 border border-ink/10">
                <div className="relative overflow-hidden">
                    <Image src={newsletterImage} alt="Join the ritual" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                </div>

                <div className="flex flex-col justify-center gap-5 border-l border-ink/10 bg-off p-14">
                    <h2 className="text-[clamp(28px,3.2vw,42px)] leading-[1.05] font-medium text-ink">
                        {newsletter.headline} <em className="font-normal text-pink-dark">{newsletter.accent}</em>
                    </h2>

                    <p className="text-[13.5px] text-grey">{newsletter.body}</p>

                    {subscribed ? (
                        <p className="text-sm font-medium text-ink">
                            You&apos;re on the list! Check your inbox for your 10% off code.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <label htmlFor="newsletter-email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="newsletter-email"
                                name="newsletter-email"
                                type="email"
                                required
                                placeholder="Your email address"
                                className="min-w-0 flex-1 border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                            />
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-none bg-pink-btn px-6 py-3 text-xs font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-pink-btn"
                            >
                                {submitting ? "Subscribing…" : "Subscribe"}
                            </button>
                        </form>
                    )}

                    <div className="text-[11.5px] text-grey">{newsletter.socialProof}</div>
                </div>
            </div>
        </div>
    );
}
