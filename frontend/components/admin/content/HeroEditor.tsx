"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HeroContent, useContent } from "@/library/content";
import Hero from "@/components/sections/Hero";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { validateAndReadImage } from "@/library/image-upload";

// Edits stage in local `draft`, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function HeroEditor() {
    const { hero, updateHero } = useContent();
    const [draft, setDraft] = useState<HeroContent>(hero);
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState<{ headline?: string; cta?: string }>({});

    const [saving, handleSave] = useAsyncAction(async () => {
        const nextErrors: { headline?: string; cta?: string } = {};
        if (!draft.headline.trim()) nextErrors.headline = "Headline is required.";
        if (!draft.cta.trim()) nextErrors.cta = "CTA button text is required.";
        if (nextErrors.headline || nextErrors.cta) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        updateHero(draft);
        setDirty(false);
        toast.success("Hero content saved.");
    });

    function handleChange(patch: Partial<HeroContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
        for (const key of Object.keys(patch) as (keyof HeroContent)[]) {
            if (errors[key as "headline" | "cta"]) setErrors((er) => ({ ...er, [key]: undefined }));
        }
    }

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await validateAndReadImage(file);
        if (!result.ok) {
            toast.error(result.reason);
            return;
        }
        handleChange({ image: result.url });
    }

    return (
        <ContentEditorShell
            title="Hero"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            preview={<Hero preview previewData={draft} />}
            featuredImage={
                <label
                    htmlFor="hero-image"
                    className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden border border-dashed border-ink/20 bg-off/50 transition hover:border-ink/35"
                >
                    {draft.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-center font-mono text-[10px] tracking-[.08em] text-ink/60 uppercase">+ Set image</span>
                    )}
                    {draft.image && (
                        <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[11.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                            Replace
                        </span>
                    )}
                    <input id="hero-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            }
        >
            <div className="mb-4">
                <label htmlFor="hero-headline" className={FIELD_LABEL}>Hero Headline</label>
                <input
                    id="hero-headline"
                    value={draft.headline}
                    onChange={(e) => handleChange({ headline: e.target.value })}
                    aria-invalid={errors.headline ? true : undefined}
                    className={`${FIELD_INPUT} ${errors.headline ? FIELD_INPUT_INVALID : ""}`}
                />
                {errors.headline && <p className={FIELD_ERROR}>{errors.headline}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor="hero-cta" className={FIELD_LABEL}>Hero CTA Button Text</label>
                <input
                    id="hero-cta"
                    value={draft.cta}
                    onChange={(e) => handleChange({ cta: e.target.value })}
                    aria-invalid={errors.cta ? true : undefined}
                    className={`${FIELD_INPUT} ${errors.cta ? FIELD_INPUT_INVALID : ""}`}
                />
                {errors.cta && <p className={FIELD_ERROR}>{errors.cta}</p>}
            </div>
            <div>
                <label htmlFor="hero-subtext" className={FIELD_LABEL}>Hero Subtext</label>
                <textarea
                    id="hero-subtext"
                    rows={2}
                    value={draft.subtext}
                    onChange={(e) => handleChange({ subtext: e.target.value })}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
        </ContentEditorShell>
    );
}
