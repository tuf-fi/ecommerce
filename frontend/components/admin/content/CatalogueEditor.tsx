"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CatalogueContent, useContent } from "@/library/content";
import Catalogue from "@/components/sections/Catalogue";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits are staged in local `draft` state and only written to the shared
// content store (which the live customer-facing site also reads) inside
// handleSave — see PageContentEditor.tsx for the reference pattern. The live
// preview below still updates on every keystroke because it's fed `draft`
// directly (via Catalogue's `previewData` prop), not the shared context.
export default function CatalogueEditor() {
    const { catalogue, updateCatalogue } = useContent();
    const [draft, setDraft] = useState<CatalogueContent>(catalogue);
    const [dirty, setDirty] = useState(false);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updateCatalogue(draft);
        setDirty(false);
        toast.success("Shop All section saved.");
    });

    function handleChange(patch: Partial<CatalogueContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    return (
        <ContentEditorShell
            title="Shop All"
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            previewLabel="cindyrella.ph/#products"
            preview={<Catalogue preview previewData={draft} />}
        >
            <div>
                <label htmlFor="catalogue-cta-label" className={FIELD_LABEL}>CTA Button Text</label>
                <input
                    id="catalogue-cta-label"
                    value={draft.ctaLabel}
                    onChange={(e) => handleChange({ ctaLabel: e.target.value })}
                    className={FIELD_INPUT}
                />
                <p className="mt-2 text-[11.5px] text-grey">
                    The button below the grid, which always links to /shop. The grid and its filters come from the product
                    catalogue — edit those under Inventory.
                </p>
            </div>
        </ContentEditorShell>
    );
}
