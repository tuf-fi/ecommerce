"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PhilosophyContent, useContent } from "@/library/content";
import Philosophy from "@/components/sections/Philosophy";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits stage in local `draft`, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function PhilosophyEditor() {
    const { philosophy, updatePhilosophy } = useContent();
    const [draft, setDraft] = useState<PhilosophyContent>(philosophy);
    const [dirty, setDirty] = useState(false);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updatePhilosophy(draft);
        setDirty(false);
        toast.success("Philosophy section saved.");
    });

    function handleChange(patch: Partial<PhilosophyContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    return (
        <ContentEditorShell
            title="Philosophy"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            preview={<Philosophy preview previewData={draft} />}
        >
            <div className="mb-4">
                <label htmlFor="philosophy-eyebrow" className={FIELD_LABEL}>Eyebrow</label>
                <input id="philosophy-eyebrow" value={draft.eyebrow} onChange={(e) => handleChange({ eyebrow: e.target.value })} className={FIELD_INPUT} />
            </div>
            <div className="mb-4">
                <label htmlFor="philosophy-headline" className={FIELD_LABEL}>Statement</label>
                <textarea
                    id="philosophy-headline"
                    rows={3}
                    value={draft.headline}
                    onChange={(e) => handleChange({ headline: e.target.value })}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
            <div>
                <label htmlFor="philosophy-subtext" className={FIELD_LABEL}>Supporting Line</label>
                <textarea
                    id="philosophy-subtext"
                    rows={3}
                    value={draft.subtext}
                    onChange={(e) => handleChange({ subtext: e.target.value })}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
        </ContentEditorShell>
    );
}
