"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageIntroContent, PageIntroKey, useContent } from "@/library/content";
import PageIntro from "@/components/sections/PageIntro";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

const PAGE_META: Record<PageIntroKey, { name: string; path: string }> = {
    shop: { name: "Shop", path: "/shop" },
    wishlist: { name: "Wishlist", path: "/wishlist" },
    cart: { name: "Cart", path: "/cart" },
    journal: { name: "Journal", path: "/journal" },
};

// Edits are staged in local `draft` state and only written to the shared
// content store (which the live customer-facing site also reads) inside
// handleSave — see PageContentEditor.tsx for the reference pattern. The live
// preview below still updates on every keystroke because it's fed `draft`
// directly (via PageIntro's `previewData` prop), not the shared context.
export default function PageIntroEditor({ pageKey }: { pageKey: PageIntroKey }) {
    const { pageIntros, updatePageIntro } = useContent();
    const intro = pageIntros[pageKey];
    const meta = PAGE_META[pageKey];
    const [draft, setDraft] = useState<PageIntroContent>(intro);
    const [dirty, setDirty] = useState(false);

    // The parent route ([slug]/page.tsx) reuses this same component instance
    // across shop/wishlist/cart/journal without a remount, so the draft has
    // to be explicitly reset whenever the caller swaps which intro is being
    // edited — otherwise a stale draft from the previous pageKey would leak
    // into the next one's preview and form fields. Adjusted during render
    // (React's recommended pattern for resetting state on a prop change)
    // rather than in an effect, which would cause an extra render pass.
    const [renderedPageKey, setRenderedPageKey] = useState(pageKey);
    if (pageKey !== renderedPageKey) {
        setRenderedPageKey(pageKey);
        setDraft(intro);
        setDirty(false);
    }

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updatePageIntro(pageKey, draft);
        setDirty(false);
        toast.success(`${meta.name} intro saved.`);
    });

    function handleChange(patch: Partial<PageIntroContent>) {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
    }

    return (
        <ContentEditorShell
            title={`${meta.name} Page Intro`}
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            dirty={dirty}
            previewLabel={`cindyrella.ph${meta.path}`}
            preview={<PageIntro pageKey={pageKey} preview previewData={draft} />}
        >
            <div className="mb-4">
                <label htmlFor="page-intro-headline" className={FIELD_LABEL}>Headline (first line)</label>
                <input
                    id="page-intro-headline"
                    value={draft.headline}
                    onChange={(e) => handleChange({ headline: e.target.value })}
                    className={FIELD_INPUT}
                />
            </div>
            <div>
                <label htmlFor="page-intro-accent" className={FIELD_LABEL}>Accent (highlighted line)</label>
                <input
                    id="page-intro-accent"
                    value={draft.accent}
                    onChange={(e) => handleChange({ accent: e.target.value })}
                    className={FIELD_INPUT}
                />
            </div>
        </ContentEditorShell>
    );
}
