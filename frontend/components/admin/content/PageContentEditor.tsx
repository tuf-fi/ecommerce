"use client";

import { useState } from "react";
import { StaticPage } from "@/library/admin/types";
import ContentEditorShell from "./ContentEditorShell";
import ShippingReturnsPage from "@/components/pages/ShippingReturnsPage";
import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";
import TermsPage from "@/components/pages/TermsPage";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Each static page has its own dedicated component so layouts can diverge later; this just picks the right one by slug.
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

const FORMATTED_SLUGS = ["privacy-policy", "terms"];

// Privacy Policy and Terms of Service understand a few simple markers; the live preview shows how they come out.
function FormattingGuide() {
    const rows: { marker: string; meaning: string }[] = [
        { marker: "## Heading", meaning: "Starts a new numbered section. Put it on its own line." },
        { marker: "Blank line", meaning: "Starts a new paragraph. Leave an empty line between paragraphs and headings." },
        { marker: "- Item", meaning: "A bullet point. Put each bullet on its own line, with no blank line between bullets." },
        { marker: "- Label: text", meaning: "In a bullet, a short label before the colon is shown in bold." },
    ];
    const example = ["Intro paragraph.", "", "## Your rights", "", "- Access: you can ask for a copy of your data.", "- Correction: you can ask us to fix it."].join("\n");
    return (
        <div>
            <dl className="space-y-2.5">
                {rows.map((r) => (
                    <div key={r.marker} className="grid grid-cols-[96px_1fr] items-baseline gap-3">
                        <dt className="font-mono text-[11.5px] break-words text-ink">{r.marker}</dt>
                        <dd className="text-[12px] leading-snug text-grey">{r.meaning}</dd>
                    </div>
                ))}
            </dl>
            <pre className="mt-3.5 border-t border-ink/10 pt-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-grey">{example}</pre>
        </div>
    );
}

// Keyed by page.id from the parent, so switching pages remounts this fresh instead of needing an effect to reset `content`.
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
            preview={<StaticPagePreview slug={page.slug} page={{ ...page, content }} />}
            guide={FORMATTED_SLUGS.includes(page.slug) ? <FormattingGuide /> : undefined}
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
