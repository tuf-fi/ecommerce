"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NewsletterContent, useContent } from "@/library/content";
import Newsletter from "@/components/sections/Newsletter";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits are staged in local `draft` state and only written to the shared
// content store (which the live customer-facing site also reads) inside
// handleSave — see PageContentEditor.tsx for the reference pattern. The live
// preview below still updates on every keystroke because it's fed `draft`
// directly (via Newsletter's `previewData` prop), not the shared context.
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
            previewLabel="cindyrella.ph/#newsletter"
            preview={<Newsletter preview previewData={draft} />}
        >
            <div className="mb-4 grid grid-cols-2 gap-4">
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
