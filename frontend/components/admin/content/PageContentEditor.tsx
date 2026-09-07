"use client";

import { useState } from "react";
import { StaticPage } from "@/library/admin/types";
import ContentEditorShell from "./ContentEditorShell";
import ShippingReturnsPage from "@/components/pages/ShippingReturnsPage";
import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";
import TermsPage from "@/components/pages/TermsPage";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Each static page has its own dedicated component (not one generic
// renderer) so Shipping & Returns/Privacy Policy/Terms can diverge in layout
// independently later — this just picks the right one by slug. (About has
// its own dedicated AboutEditor/AboutSection pair, same as Hero — it never
// reaches this generic single-textarea editor.)
function StaticPagePreview({ slug, page }: { slug: string; page: StaticPage }) {
    switch (slug) {
        case "shipping-returns":
            return <ShippingReturnsPage page={page} preview />;
        case "privacy-policy":
            return <PrivacyPolicyPage page={page} preview />;
        case "terms":
            return <TermsPage page={page} preview />;
        default:
            return null;
    }
}

// Keyed by page.id from the parent, so navigating between two different
// pages remounts this fresh instead of needing an effect to reset `content`.
export default function PageContentEditor({ page, onSave }: { page: StaticPage; onSave: (id: number, content: string) => void }) {
    const [content, setContent] = useState(page.content);
    const dirty = content !== page.content;

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        onSave(page.id, content);
    });

    return (
        <ContentEditorShell
            title={page.name}
            titleMeta={`Last updated ${page.updated}`}
            backLabel="Pages"
            backHref="/admin/content?tab=pages"
            saving={saving}
            onSave={handleSave}
            saveLabel="Save Page"
            dirty={dirty}
            previewLabel={`cindyrella.ph/pages/${page.slug}`}
            preview={<StaticPagePreview slug={page.slug} page={{ ...page, content }} />}
        >
            <div>
                <label htmlFor="page-content" className={FIELD_LABEL}>Page Content</label>
                <textarea
                    id="page-content"
                    rows={14}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
        </ContentEditorShell>
    );
}
