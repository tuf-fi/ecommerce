"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageIntroContent, PageIntroKey, useContent } from "@/library/content";
import PageIntro from "@/components/sections/PageIntro";
import ShopPage from "@/components/pages/ShopPageView";
import WishlistPage from "@/components/pages/WishlistPageView";
import CartPage from "@/components/pages/CartPageView";
import ContentEditorShell from "./ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "../formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

const PAGE_META: Record<PageIntroKey, { name: string; path: string }> = {
    shop: { name: "Shop", path: "/shop" },
    wishlist: { name: "Wishlist", path: "/wishlist" },
    cart: { name: "Cart", path: "/cart" },
    journal: { name: "Journal", path: "/journal" },
};

// Edits stage in local `draft`, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function PageIntroEditor({ pageKey }: { pageKey: PageIntroKey }) {
    const { pageIntros, updatePageIntro } = useContent();
    const intro = pageIntros[pageKey];
    const meta = PAGE_META[pageKey];
    const [draft, setDraft] = useState<PageIntroContent>(intro);
    const [dirty, setDirty] = useState(false);

    // The parent reuses this instance across pages without remounting, so the draft is reset during render when pageKey changes, to avoid a stale draft leaking into the next page.
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
            // Shop/Wishlist/Cart show the real page (only the intro headline/accent are editable — the rest, e.g.
            // the product grid, is real data, not admin copy) so admins see the intro in context, not isolated.
            // previewScroll="page": these are genuinely full pages, not a single content block, so the admin page
            // scrolls with them instead of clipping them inside the usual small fixed pane.
            // Journal has no such full-page reuse candidate here, so it keeps the compact intro-only preview.
            previewScroll={pageKey === "shop" || pageKey === "wishlist" || pageKey === "cart" ? "page" : "pane"}
            preview={
                pageKey === "shop" ? (
                    <ShopPage preview introPreviewData={draft} />
                ) : pageKey === "wishlist" ? (
                    <WishlistPage preview introPreviewData={draft} />
                ) : pageKey === "cart" ? (
                    <CartPage preview introPreviewData={draft} />
                ) : (
                    <PageIntro pageKey={pageKey} preview previewData={draft} />
                )
            }
        >
            {/* Stacked, not side-by-side — the panel's fixed ~360px width
                leaves too little room per field for a two-column grid to read
                as anything but cramped. */}
            <div className="flex flex-col gap-4">
                <div>
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
            </div>
        </ContentEditorShell>
    );
}
