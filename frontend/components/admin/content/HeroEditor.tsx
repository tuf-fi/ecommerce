"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HeroContent, useContent } from "@/library/content";
import Hero from "@/components/sections/Hero";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits are staged in local `draft` state and only written to the shared
// content store (which the live customer-facing site also reads) inside
// handleSave — see PageContentEditor.tsx for the reference pattern. The live
// preview below still updates on every keystroke because it's fed `draft`
// directly (via Hero's `previewData` prop), not the shared context.
export default function HeroEditor() {
    const { hero, updateHero } = useContent();
    const [draft, setDraft] = useState<HeroContent>(hero);
    const [dirty, setDirty] = useState(false);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updateHero(draft);
        setDirty(false);
        toast.success("Hero content saved.");
    });

    function handleChange(patch: Partial<HeroContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            handleChange({ image: reader.result as string });
        };
        reader.readAsDataURL(file);
    }

    return (
        <ContentEditorShell
            title="Hero"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            previewLabel="cindyrella.ph"
            preview={<Hero preview previewData={draft} />}
        >
            {/* Small square, not a full-width preview — the actual image is
                already visible full-size in the live preview above. */}
            <div className="mb-5 flex items-center gap-3.5">
                <label
                    htmlFor="hero-image"
                    className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft"
                >
                    {draft.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-center font-mono text-[9px] text-ink/60">+ Image</span>
                    )}
                    <input id="hero-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <span className="text-[11.5px] text-grey">Shown full-size in the live preview above</span>
            </div>

            <div className="mb-4">
                <label htmlFor="hero-headline" className={FIELD_LABEL}>Hero Headline</label>
                <input
                    id="hero-headline"
                    value={draft.headline}
                    onChange={(e) => handleChange({ headline: e.target.value })}
                    className={FIELD_INPUT}
                />
            </div>
            <div className="mb-4">
                <label htmlFor="hero-cta" className={FIELD_LABEL}>Hero CTA Button Text</label>
                <input
                    id="hero-cta"
                    value={draft.cta}
                    onChange={(e) => handleChange({ cta: e.target.value })}
                    className={FIELD_INPUT}
                />
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
