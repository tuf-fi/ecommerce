"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AboutContent, useContent } from "@/library/content";
import AboutSection from "@/components/sections/About";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits stage in local `draft`, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function AboutEditor() {
    const { about, updateAbout } = useContent();
    const [draft, setDraft] = useState<AboutContent>(about);
    const [dirty, setDirty] = useState(false);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updateAbout(draft);
        setDirty(false);
        toast.success("About section saved.");
    });

    function handleChange(patch: Partial<AboutContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    return (
        <ContentEditorShell
            title="About"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            preview={<AboutSection preview previewData={draft} />}
        >
            <div className="mb-4">
                <label htmlFor="about-founder" className={FIELD_LABEL}>Founder Year</label>
                <input id="about-founder" value={draft.founder} onChange={(e) => handleChange({ founder: e.target.value })} className={FIELD_INPUT} />
            </div>
            <div className="mb-4">
                <label htmlFor="about-location" className={FIELD_LABEL}>Location</label>
                <input id="about-location" value={draft.location} onChange={(e) => handleChange({ location: e.target.value })} className={FIELD_INPUT} />
            </div>
            <div className="mb-4">
                <label htmlFor="about-focus" className={FIELD_LABEL}>Focus</label>
                <input id="about-focus" value={draft.focus} onChange={(e) => handleChange({ focus: e.target.value })} className={FIELD_INPUT} />
            </div>
            <div className="mb-4">
                <label htmlFor="about-lead" className={FIELD_LABEL}>Lead Sentence (highlighted)</label>
                <input id="about-lead" value={draft.lead} onChange={(e) => handleChange({ lead: e.target.value })} className={FIELD_INPUT} />
            </div>
            <div>
                <label htmlFor="about-body" className={FIELD_LABEL}>Body</label>
                <textarea
                    id="about-body"
                    rows={6}
                    value={draft.body}
                    onChange={(e) => handleChange({ body: e.target.value })}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
        </ContentEditorShell>
    );
}
