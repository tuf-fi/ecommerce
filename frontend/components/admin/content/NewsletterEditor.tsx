"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NewsletterContent, useContent } from "@/library/content";
import Newsletter from "@/components/sections/Newsletter";
import Footer from "@/components/layout/Footer";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits stage in local `draft`, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function NewsletterEditor() {
    const { newsletter, updateNewsletter } = useContent();
    const [draft, setDraft] = useState<NewsletterContent>(newsletter);
    const [dirty, setDirty] = useState(false);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updateNewsletter(draft);
        setDirty(false);
        toast.success("Newsletter section saved.");
    });

    function handleChange(patch: Partial<NewsletterContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    return (
        <ContentEditorShell
            title="Newsletter"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            preview={
                <>
                    <Newsletter preview previewData={draft} />
                    {/* Newsletter sits directly above the sitewide footer on the real site — a clipped glimpse (not
                        the whole thing) shows how the section reads against it, faded rather than hard-cropped. */}
                    <div className="relative max-h-[280px] overflow-hidden">
                        <Footer preview />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-footer to-transparent" />
                    </div>
                </>
            }
        >
            {/* Stacked, not side-by-side — the panel's fixed ~360px width
                leaves too little room per field for a two-column grid to read
                as anything but cramped. */}
            <div className="mb-4 flex flex-col gap-4">
                <div>
                    <label htmlFor="newsletter-headline" className={FIELD_LABEL}>Headline</label>
                    <input
                        id="newsletter-headline"
                        value={draft.headline}
                        onChange={(e) => handleChange({ headline: e.target.value })}
                        className={FIELD_INPUT}
                    />
                </div>
                <div>
                    <label htmlFor="newsletter-accent" className={FIELD_LABEL}>Accent (highlighted)</label>
                    <input
                        id="newsletter-accent"
                        value={draft.accent}
                        onChange={(e) => handleChange({ accent: e.target.value })}
                        className={FIELD_INPUT}
                    />
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="newsletter-body" className={FIELD_LABEL}>Body</label>
                <textarea
                    id="newsletter-body"
                    rows={3}
                    value={draft.body}
                    onChange={(e) => handleChange({ body: e.target.value })}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
            <div>
                <label htmlFor="newsletter-social-proof" className={FIELD_LABEL}>Social Proof Line</label>
                <input
                    id="newsletter-social-proof"
                    value={draft.socialProof}
                    onChange={(e) => handleChange({ socialProof: e.target.value })}
                    className={FIELD_INPUT}
                />
                <p className="mt-2 text-[11.5px] text-grey">Sits beside the five stars under the signup form.</p>
            </div>
        </ContentEditorShell>
    );
}
